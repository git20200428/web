import React, {Component} from 'react';

class ReactTextInRectangleIcon extends Component {
    render() {
        let {id, title, text, color} = this.props;
        let colorClass = [
            color || ""
        ];

        return <input type="button" id={id}
                      className={"resetButton react-table-global-btn " + colorClass.join(" ")}
                      role="button" value={text} title={title}
        />
    }
}

export default ReactTextInRectangleIcon;
