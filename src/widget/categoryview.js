/********************************************************************************************
* This file is Copyright (C) 2023 CICI Lab - Arizona State University, all rights reserved.
* 
* Authors:
*   Sizhe Wang, Arizona State Unvisity
*   Wenwen Li, Arizona State Unvisity
*   Xiao Chen, Arizona State Unvisity
*   Zhining Gu, Arizona State Unvisity
*   Yuanyuan Tian, Arizona State Unvisity
*   
* If you wish to refer to the methods or results in your research, please cite the 
* following paper:  
*   Li, W.; Wang, S.; Chen, X.; Tian, Y.; Gu, Z.; Lopez-Carr, A.; Schroeder, A.; 
*   Currier, K.; Schildhauer, M.; Zhu, R. (2023). Geographvis: a knowledge graph and 
*   geovisualization empowered cyberinfrastructure to support disaster response and 
*   humanitarian aid. ISPRS International Journal of Geo-Information, 12(3), 112.
*
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*     http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.   
********************************************************************************************/


import React from 'react';
import Constant from '../util/constant';
import Utils from '../util/utils';
import Widget from './widget';
import * as d3 from 'd3';

class CategoryView extends Widget {
    constructor(props) {
        super(props);

        this.event_types = null;
        this.max_value = 0
        this.updateStats();

        let enabled = {};
        for (let e of this.event_types)
            enabled[e.name] = true;

        this.state = { enabled, ...this.state }
    }
    onClick(name) {
        return () => {
            const enabled = {...this.state.enabled};
            enabled[name] = !enabled[name];
            this.setState({ enabled });
        }
    }
    onRightClick(name) {
        return (e) => {
            e.preventDefault();

            const enabled = {...this.state.enabled};
            const only = Object.values(enabled).reduce((a, b) => a + b) === 1;
            if ( only && enabled[name]) {
                for (let i in enabled) 
                    enabled[i] = true;
            } else {
                for (let i in enabled) 
                    enabled[i] = false;
                enabled[name] = true;
            }
            this.setState({ enabled });
        }
    }
    filter(ele) {
        const enabled = Object.entries(this.state.enabled)
            .filter(([k, v]) => v)
            .map(([k, v]) => k);
        return enabled.indexOf(this.props.data.getEventTypeOfElement(ele)) > -1;
    }
    updateStats() {
        const symlen = Constant.SYMBOL_CAT10.length;
        this.event_types = this.props.data.getEventTypes(this.props.statsKey, true)
            .map((x, i) => ({...x, 
                symbol: d3.symbol().size(100).type(Constant.SYMBOL_CAT10[i % symlen])()
            })) 
            .sort((a, b) => b.value - a.value);
        this.max_value = this.event_types.max(x => x.value);
    }
    componentDidUpdate(prevProps, prevState, snapshot) {        
        if (prevProps.statsKey !== this.props.statsKey) {
            this.updateStats();
            this.forceUpdate();
        }

        const e = prevState.enabled;
        const E = this.state.enabled;
        if (e !== E)
            this.props.sendMessage('filter');
    }

    subrender() { 
        let title = 'Disaster Type';
        if (!this.props.statsKey || this.props.statsKey.startsWith(Constant.IMPACT_LAYER_PREFIX)) {
            title = `${this.props.data.getStatNameByKey(this.props.statsKey)} by ${title}`;
        } else {
            this.max_value = Number.MAX_VALUE;
        }
        super.setTitle(title);

        return ( 
            <div className="category-view">
                { this.event_types.map((x, i) =>
                    <div className="entry">
                        <svg className={`bulb ${this.state.enabled[x.name] ? '' : 'deselected'}`}>
                            <path d={x.symbol}></path>
                        </svg>
                        <div className="bin">
                            <div style={{width: `${100 * x.value / this.max_value}%`}}></div>
                        </div>
                        <div className="name">{x.name}</div>
                        <div className="value">{Utils.formatNumber(x.value)}</div>
                        <div className="selector" 
                            onClick={this.onClick(x.name)}
                            onContextMenu={this.onRightClick(x.name)}></div>
                    </div>
                )}
            </div>
        );
    }
}
 
export default CategoryView;