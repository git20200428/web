import React from "react";
import AlarmWidget from "./alarm_widget";
import NEInfoWidget from "./neinfo_widget";
import EntityStatusWidget from "./entity_status_widget";
import ServiceWidget from "./service_widget";

export default function Dashboard() {
    return (
        <div className="dashboard-wrapper">
            <NEInfoWidget/>
            <AlarmWidget/>
            <EntityStatusWidget/>
            <ServiceWidget/>
        </div>
    );
};