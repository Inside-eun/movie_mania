import UIKit
import Capacitor
import WebKit

class MainViewController: CAPBridgeViewController {
    private var offlineNavigationHandler: OfflineNavigationHandler?

    // 임시 진단용 화면 로그. 케이블 없이도 무슨 일이 일어나는지 스크린샷으로
    // 확인할 수 있도록 상단에 최근 로그 몇 줄을 띄운다. 원인 파악 끝나면 지울 것.
    private lazy var debugLabel: UILabel = {
        let label = UILabel()
        label.numberOfLines = 0
        label.font = .monospacedSystemFont(ofSize: 10, weight: .regular)
        label.textColor = .green
        label.backgroundColor = UIColor.black.withAlphaComponent(0.85)
        label.translatesAutoresizingMaskIntoConstraints = false
        label.isHidden = true
        return label
    }()
    private var debugLines: [String] = []

    override func viewDidLoad() {
        super.viewDidLoad()
        webView?.allowsBackForwardNavigationGestures = true

        // 엣지 스와이프로 뒤로가기 하는 동안 아직 렌더링되지 않은 영역이
        // WKWebView의 기본 흰색 배경으로 노출되는 것을 막는다.
        view.backgroundColor = .black
        webView?.isOpaque = true
        webView?.backgroundColor = .black
        webView?.scrollView.backgroundColor = .black
        if #available(iOS 15.0, *) {
            webView?.underPageBackgroundColor = .black
        }

        view.addSubview(debugLabel)
        NSLayoutConstraint.activate([
            debugLabel.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            debugLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            debugLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor),
        ])

        // CAPBridgeViewController 자체는 WKNavigationDelegate가 아니라 내부적으로
        // 별도 객체를 webView.navigationDelegate로 쓰고 있어서, 이 메서드를
        // 직접 override할 수 없다. 대신 기존 delegate를 감싸는 프록시를 끼워
        // 넣어서, 오프라인/타임아웃 실패만 가로채고 나머지는 그대로 Capacitor에
        // 위임한다(브릿지 동작 보존).
        if let webView = webView {
            let originalDelegate = webView.navigationDelegate
            appendDebugLog("wrap navigationDelegate, original=\(originalDelegate.map { String(describing: type(of: $0)) } ?? "nil")")
            let handler = OfflineNavigationHandler(originalDelegate: originalDelegate, log: { [weak self] line in
                self?.appendDebugLog(line)
            })
            webView.navigationDelegate = handler
            offlineNavigationHandler = handler
        } else {
            appendDebugLog("webView is nil, cannot wrap navigationDelegate")
        }
    }

    private func appendDebugLog(_ line: String) {
        NSLog("[OfflineHandler] %@", line)
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            self.debugLines.append(line)
            if self.debugLines.count > 12 { self.debugLines.removeFirst() }
            self.debugLabel.text = self.debugLines.joined(separator: "\n")
            self.debugLabel.isHidden = false
            self.view.bringSubviewToFront(self.debugLabel)
        }
    }
}

private class OfflineNavigationHandler: NSObject, WKNavigationDelegate {
    private weak var originalDelegate: WKNavigationDelegate?
    private let log: (String) -> Void

    // 오프라인/타임아웃/서버 연결 불가로 최초 로드에 실패했을 때만 로컬
    // 오프라인 안내 페이지로 전환한다. 그 외 에러(예: JS 내부 네비게이션
    // 오류)는 무시한다.
    private let offlineErrorCodes: Set<Int> = [
        URLError.notConnectedToInternet.rawValue,
        URLError.timedOut.rawValue,
        URLError.cannotConnectToHost.rawValue,
        URLError.cannotFindHost.rawValue,
        URLError.networkConnectionLost.rawValue,
        URLError.dnsLookupFailed.rawValue,
        URLError.internationalRoamingOff.rawValue,
        URLError.dataNotAllowed.rawValue,
    ]

    init(originalDelegate: WKNavigationDelegate?, log: @escaping (String) -> Void) {
        self.originalDelegate = originalDelegate
        self.log = log
    }

    // 우리가 구현하지 않은 WKNavigationDelegate 메서드는 전부 원래
    // delegate(Capacitor 내부 객체)로 그대로 전달한다.
    override func responds(to aSelector: Selector!) -> Bool {
        if super.responds(to: aSelector) { return true }
        return originalDelegate?.responds(to: aSelector) ?? false
    }

    override func forwardingTarget(for aSelector: Selector!) -> Any? {
        if super.responds(to: aSelector) { return nil }
        return originalDelegate
    }

    // Capacitor의 원래 delegate는 server.url 오리진 밖으로의 네비게이션을
    // 보안상 취소한다. loadFileURL로 쏘는 file:// 오프라인 페이지도 이 정책에
    // 걸려 조용히 취소되면서 흰 화면만 남았던 것 — file:// 네비게이션만
    // 명시적으로 허용하고, 나머지는 원래 delegate의 정책 판단에 그대로 맡긴다.
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        if navigationAction.request.url?.isFileURL == true {
            log("allowing file:// navigation to \(navigationAction.request.url?.path ?? "")")
            decisionHandler(.allow)
            return
        }
        // original.webView?(...)는 원래 delegate가 이 구체적인 오버로드를
        // 구현하지 않으면 아무 것도 안 하고 조용히 끝난다(nil 반환) — 그러면
        // decisionHandler가 영영 안 불려서 네비게이션이 멈춰버리므로, 호출이
        // 실제로 안 됐을 때는 우리가 대신 allow로 마무리한다.
        let forwarded: Void? = originalDelegate?.webView?(webView, decidePolicyFor: navigationAction, decisionHandler: decisionHandler)
        if forwarded == nil {
            decisionHandler(.allow)
        }
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        let nsError = error as NSError
        log("didFailProvisional domain=\(nsError.domain) code=\(nsError.code)")
        originalDelegate?.webView?(webView, didFailProvisionalNavigation: navigation, withError: error)
        showOfflinePageIfNetworkError(webView, error)
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        let nsError = error as NSError
        log("didFail domain=\(nsError.domain) code=\(nsError.code)")
        originalDelegate?.webView?(webView, didFail: navigation, withError: error)
        showOfflinePageIfNetworkError(webView, error)
    }

    private func showOfflinePageIfNetworkError(_ webView: WKWebView, _ error: Error) {
        let nsError = error as NSError
        guard nsError.domain == NSURLErrorDomain, offlineErrorCodes.contains(nsError.code) else {
            log("error not in offline list, ignoring")
            return
        }
        guard let publicDir = Bundle.main.url(forResource: "public", withExtension: nil) else {
            log("FAILED: 'public' folder not in bundle")
            return
        }
        guard let offlineURL = Bundle.main.url(forResource: "offline", withExtension: "html", subdirectory: "public") else {
            log("FAILED: offline.html not found in \(publicDir.path)")
            return
        }
        log("loading offline.html from \(offlineURL.path)")
        webView.loadFileURL(offlineURL, allowingReadAccessTo: publicDir)
    }
}
