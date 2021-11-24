import React, {Component} from 'react';

class ReactTextInCircleIcon extends Component {
    render() {
        let {title, text, color} = this.props;
        let colorClass = [
            "span-circle",
            color || ""
        ];
        return <span className={colorClass.join(" ")} title={title}>{text}</span>;
    }
}

export default ReactTextInCircleIcon;