import React, {Component} from 'react';

require("../../../css/common/counters.css");

class Counters extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <span>
              {Object.keys(this.props.data).map((item, idx) =>
                  <span key={idx} className="counter" title={this.props.data[item]}>{this.props.data[item]}</span>
              )}
            </span>
        );
    }
}


export default Counters;