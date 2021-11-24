import React from "react";
import ReactDOM from "react-dom";
import {BrowserRouter, HashRouter} from "react-router-dom";
import {Provider} from "react-redux";

import store from "./redux/store";
import App from "./appframe/app";
import Alert from "./components/alert/alert";
import {changeFavicon, collapseOthers} from "./custom/utils";
import {loadWebTheme} from "./setting/init";

import "../css/layout/reset.css";
import "../css/about/about.css";
import "../css/chassis/chassis_view.css";
import "../css/common/common.css";
import "../css/common/loading-modal.css";
import "../css/dashboard/menufont.css";
import "../css/layout/main.css";
import "../css/dashboard/dashboard.css";
import "../css/layout/sidebar.css";
import "../css/edit_select/editable-select.css";
import "../css/grid/grid.css";
import "../css/layout/react_layout.css";
import "../css/login/loginpage.css";
import "../css/pmfigure/pmfigure.css";
import "../css/progress/react-progress.css";
import "../css/table/react_table.css";
import "../css/table/react_tree_table.css";
import "../font/iconfont.css";
import "../css/trib/timeslot.css";
import "../css/tooltip/tooltipstyle.css";
import "../css/service/service_view.css";
import "../css/layout/statusbar.css";

loadWebTheme();
changeFavicon();
document.body.onscroll = (e) => {
    collapseOthers();
    e.stopPropagation();
}
ReactDOM.render(
    <React.StrictMode>
        <Provider store={store}>
            {window.location.href.match("/documentation/") ?
                <BrowserRouter><App/></BrowserRouter>
                : <HashRouter>
                    <App/>
                </HashRouter>
            }
            {ReactDOM.createPortal(<Alert/>, document.body)}
        </Provider>
    </React.StrictMode>,
    document.getElementById("root")
);