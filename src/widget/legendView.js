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


import React, { Component } from 'react';
import Utils from '../util/utils';

class LegendView extends Component {
    constructor(props) {
        super(props);
        this.state = {  }
    }
    render() { 
        const colors = [
            '255,255,0',
            '255,0,0'
        ];
        const strColor = colors.map(x => `rgb(${x})`).join(',');
        const lgd_info = this.props.data.__curr_legend;
        const lyr_info = this.props.data.getStatInfoByKey(this.props.statsKey);

        return (
            lgd_info &&
            <div className="legend-view">
                <p>{lyr_info.name} {lyr_info.unit && `(${lyr_info.unit})`}</p>
                <div className="color-box"
                     style={{background: `linear-gradient(to right, ${strColor})`}}></div>
                <div className="ticks"></div>
                <div className="tick-num">
                    <span>{Utils.formatNumber(Utils.formatDecimal(lgd_info.min * (lyr_info.scalar || 1), 2), true)}</span>
                    <span>{Utils.formatNumber(Utils.formatDecimal(lgd_info.max * (lyr_info.scalar || 1), 2), true)}</span>
                </div>
            </div>
        );
    }
}
 
export default LegendView;