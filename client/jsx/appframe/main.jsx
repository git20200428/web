import React, {useEffect} from "react";
import {NavLink, Redirect, Route, Switch, useLocation, useParams, useRouteMatch} from "react-router-dom";

import ChassisView from "../chassis/chassis_view";
import Dashboard from "../dashboard/dashboard";
import AdminView from "./adminview";
import TestView from "./testview";

import dynamicPanel from "../custom/table/dynamicTable";
import {getHelpUrl, getText, MENUCONFIG, parseURLParameter} from "../custom/utils";
import {parseURLEvent} from "../urlEvent";

export default function MainComponent() {
    const search = useLocation().search;
    useEffect(() => {
        parseURLEvent(search);
    });

    return (
        <main id="mainContainer">
            <Switch>
                <Route exact path="/doc"><LinkToDocumentation /></Route>
                <Route exact path="/documentation"><LinkToDocumentation /></Route>
                <Route exact path="/">{
                    location.href.endsWith("/documentation/") ? location.href = location.href.replace("#/", "") : <ChassisView/>
                }</Route>
                <Route exact path="/chassisboardview"><ChassisView/></Route>
                <Route exact path="/dashboard"><Dashboard/></Route>
                <Route exact path="/admin"><AdminView/></Route>
                <Route exact path="/test"><TestView/></Route>
                <Route path="/:other"><ContentWrapper/></Route>
            </Switch>
        </main>
    );
}

function LinkToDocumentation() {
    location.href = "/documentation/";
}

function isActivePage(url) {
    return window.location.href.endsWith("/" + url);
}

function ContentWrapper() {
    let match = useRouteMatch();
    let page = match.url.match(/\/(.*)/)[1];
    if (MENUCONFIG[page] == null) {
        return (<div>404 Page not found</div>);
    }
    const TabItemList = Object.values(MENUCONFIG[page].panels).map(panel => {
        return (
            <div className="tabDiv" key={panel.name}>
                <NavLink
                    activeClassName="content-menu-selected"
                    className="content-menu"
                    to={`${match.url}/${panel.name}`}
                >
                    {getText(panel.name)}
                </NavLink>
                {isActivePage(panel.name) ?
                    <a href={`/webgui_help/${getHelpUrl(
                        panel.helpString ? panel.helpString : panel.name.toLowerCase().replaceAll("-", "").replaceAll(" ", ""))}`}
                       target="_webgui_help">
                        <span className="iconfont icon-help helpIcon tabHelpIcon"/>
                    </a>
                    : ""}
            </div>
        );
    });
    const refDiv = React.useRef();
    useEffect(() => {
        refDiv.current.lPosition = 0;
        refDiv.current.style.left = "0px";
        window.addEventListener("resize", resizeListener);
        let p = refDiv.current.parentElement;
        let c = refDiv.current.getBoundingClientRect();
        if (p.getBoundingClientRect().right < c.right) {
            p.classList.add("show");
        } else {
            p.classList.remove("show");
        }
        return () => {
            window.removeEventListener("resize", resizeListener);
        }
    }, [page]);

    function resizeListener() {
        let parent = refDiv.current.parentElement;
        let p = parent.getBoundingClientRect();
        let c = refDiv.current.getBoundingClientRect();
        if (p.width < c.width) {
            parent.classList.add("show");
        } else {
            parent.classList.remove("show");
            refDiv.current.lPosition = 0;
            refDiv.current.style.left = "0px";
        }
    }

    function moveLeft() {
        if (refDiv.current.lPosition < 0) {
            refDiv.current.lPosition = refDiv.current.lPosition + 10;
            refDiv.current.style.left = refDiv.current.lPosition + "px";
        }
    }

    function moveRight() {
        let child = refDiv.current.lastElementChild;
        let cc = child.getBoundingClientRect();
        if (refDiv.current.parentElement.getBoundingClientRect().right - 30 < cc.right + 4) {
            refDiv.current.lPosition = refDiv.current.lPosition - 10;
            refDiv.current.style.left = refDiv.current.lPosition + "px"
        }
    }

    return (
        <div className="content-div">
            <div className="content-header ">
                <div className="flex-relative-position" ref={refDiv}>
                    {TabItemList}
                </div>
                <div className="move">
                    <span className="iconfont icon-chevron_left" onClick={moveLeft}/>
                    <span className="iconfont icon-chevron_right" onClick={moveRight}/>
                </div>
            </div>
            <Switch>
                <Route path={`${match.path}/:selected`}>
                    <ContentComponent page={page}/>
                </Route>
                <Route path={match.path}>
                    <Redirect to={`${match.url}/${MENUCONFIG[page].default}`}/>
                </Route>
            </Switch>
        </div>
    );
}

function ContentComponent(props) {
    let {selected} = useParams();
    let _urlSearch = useLocation().search.trim().toString();
    let showConfig = parseURLParameter(_urlSearch);
    if (MENUCONFIG[props.page] == null || MENUCONFIG[props.page].panels[selected] == null) {
        return (<div>404 Panel not found</div>);
    }
    let items = MENUCONFIG[props.page].panels[selected].items;
    return (
        <div className={"content-body"}>
            <div className={"contentbody-panel " + (items.length <= 1 ? "columnFlexLayout" : "")}>
                {dynamicPanel(null, showConfig, MENUCONFIG[props.page].panels[selected].items)}
            </div>
        </div>
    );
}