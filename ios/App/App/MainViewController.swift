import UIKit
import Capacitor

class MainViewController: CAPBridgeViewController {
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
}
