import UIKit
import Capacitor
import WebKit

class MainViewController: CAPBridgeViewController {
    private var offlineNavigationHandler: OfflineNavigationHandler?

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

        // CAPBridgeViewController 자체는 WKNavigationDelegate가 아니라 내부적으로
        // 별도 객체를 webView.navigationDelegate로 쓰고 있어서, 이 메서드를
        // 직접 override할 수 없다. 대신 기존 delegate를 감싸는 프록시를 끼워
        // 넣어서, 오프라인/타임아웃 실패만 가로채고 나머지는 그대로 Capacitor에
        // 위임한다(브릿지 동작 보존).
        if let webView = webView {
            let originalDelegate = webView.navigationDelegate
            NSLog("[OfflineHandler] wrapping navigationDelegate, original=%@", originalDelegate.map { String(describing: type(of: $0)) } ?? "nil")
            let handler = OfflineNavigationHandler(originalDelegate: originalDelegate)
            webView.navigationDelegate = handler
            offlineNavigationHandler = handler
        } else {
            NSLog("[OfflineHandler] webView is nil in viewDidLoad, cannot wrap navigationDelegate")
        }
    }
}

private class OfflineNavigationHandler: NSObject, WKNavigationDelegate {
    private weak var originalDelegate: WKNavigationDelegate?

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

    init(originalDelegate: WKNavigationDelegate?) {
        self.originalDelegate = originalDelegate
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

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        let nsError = error as NSError
        NSLog("[OfflineHandler] didFailProvisionalNavigation domain=%@ code=%ld desc=%@", nsError.domain, nsError.code, nsError.localizedDescription)
        originalDelegate?.webView?(webView, didFailProvisionalNavigation: navigation, withError: error)
        showOfflinePageIfNetworkError(webView, error)
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        let nsError = error as NSError
        NSLog("[OfflineHandler] didFail domain=%@ code=%ld desc=%@", nsError.domain, nsError.code, nsError.localizedDescription)
        originalDelegate?.webView?(webView, didFail: navigation, withError: error)
        showOfflinePageIfNetworkError(webView, error)
    }

    private func showOfflinePageIfNetworkError(_ webView: WKWebView, _ error: Error) {
        let nsError = error as NSError
        guard nsError.domain == NSURLErrorDomain, offlineErrorCodes.contains(nsError.code) else {
            NSLog("[OfflineHandler] error not in offline list (domain=%@ code=%ld), ignoring", nsError.domain, nsError.code)
            return
        }
        guard let publicDir = Bundle.main.url(forResource: "public", withExtension: nil) else {
            NSLog("[OfflineHandler] FAILED to locate 'public' folder in bundle")
            return
        }
        guard let offlineURL = Bundle.main.url(forResource: "offline", withExtension: "html", subdirectory: "public") else {
            NSLog("[OfflineHandler] FAILED to locate offline.html inside %@", publicDir.path)
            return
        }
        NSLog("[OfflineHandler] loading offline page from %@", offlineURL.path)
        webView.loadFileURL(offlineURL, allowingReadAccessTo: publicDir)
    }
}
