import React, {useEffect} from "react";
import {useDispatch, useSelector} from "react-redux";

import Login from "./login";
import HeadBar from "./headbar";
import SideBar from "./sidebar";
import Main from "./main";
import {to_login} from "../redux/actions";
import {collapseOthers} from "../custom/utils";
import StatusBar from "./statusbar";

const App = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(to_login({}, 1));
    }, []);
    const isLogin = useSelector(state => state.hasOwnProperty("neinfo") ? state.neinfo.islogin : false);

    if (isLogin === 0) {
        return null;
    }

    return isLogin === 2 ? (
        <div id="webGUIApp" onClick={collapseOthers}>
            <header className="side-background">
                <a className="logo-wrapper" href="http://www.infinera.com" target="_blank" rel="noopener">
                    <i className="iconfont icon-favicon_infinera logo-icon"/>
                    <i className="iconfont icon-infinera_text logo-text"/>
                </a>
            </header>
            <HeadBar/>
            <div className="sidebar-frame">
                <SideBar/>
                <StatusBar/>
            </div>
            <Main/>
        </div>) : <Login/>;
};

export default App;