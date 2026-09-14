import UIKit
import Capacitor
import WebKit

class MainViewController: CAPBridgeViewController {
    // 오프라인/타임아웃/서버 연결 불가로 최초 로드에 실패했을 때만 로컬
    // 오프라인 안내 페이지로 전환한다. 그 외 에러(예: JS 내부 네비게이션
    // 오류)는 Capacitor 기본 동작을 그대로 따른다.
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
    }

    override func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        super.webView(webView, didFailProvisionalNavigation: navigation, withError: error)
        showOfflinePageIfNetworkError(error)
    }

    override func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        super.webView(webView, didFail: navigation, withError: error)
        showOfflinePageIfNetworkError(error)
    }

    private func showOfflinePageIfNetworkError(_ error: Error) {
        let nsError = error as NSError
        guard nsError.domain == NSURLErrorDomain, offlineErrorCodes.contains(nsError.code) else { return }
        guard
            let publicDir = Bundle.main.url(forResource: "public", withExtension: nil),
            let offlineURL = Bundle.main.url(forResource: "offline", withExtension: "html", subdirectory: "public")
        else { return }
        webView?.loadFileURL(offlineURL, allowingReadAccessTo: publicDir)
    }
}
