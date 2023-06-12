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
import NOAADisaster from '../datasets/NOAADisaster';
import Constant from '../util/constant';
import Utils from '../util/utils';

class StatsView extends Component {
    constructor(props) {
        super(props);
        this.stats = this.props.data.getStats(true);
        this.state = { 
            folded: {
                'disaterLayers': false,
                'healthLayers': false,
            }
        }
    }
    onFoldLayers(grpName) {
        return () => {
            const folded = this.state.folded;
            folded[grpName] = !folded[grpName];
            this.setState({ folded });
        }
    }
    render() { 
        return ( 
            <div className="stats-view">
                <p>Layers & Statistics of&nbsp;
                    <i className='storm-name'>{Utils.renderStormName(this.props.stormName)}</i>
                </p>
                <div className='layer-box'>
                <h1 onClick={this.onFoldLayers('disaterLayers')}>
                    <span>{this.state.folded.disaterLayers ? '▶' : '▼'}</span>
                    Storm Impact Layers
                </h1>
                <div className={'layer-group' + (this.state.folded.disaterLayers ? ' folded' : ' ')}>
                {this.stats.filter(x => !x.key || x.key.startsWith(Constant.IMPACT_LAYER_PREFIX)).map(x => 
                    <div className={x.key === this.props.statsKey ? 'selected' : ''}
                         onClick={() => this.props.sendMessage('setStatsKey', x.key)}>
                        <span class="section">{x.name}</span>
                        <span class="value">{Utils.formatNumber(x.total) + (x.unit ? ` ${x.unit}` : '')}</span>
                    </div>
                )}
                </div>
                <h1 onClick={this.onFoldLayers('healthLayers')}>
                    <span>{this.state.folded.healthLayers ? '▶' : '▼'}</span>
                    Health Factor Layers
                </h1>
                <div className={'layer-group' + (this.state.folded.healthLayers ? ' folded' : ' ')}>
                {NOAADisaster.HEALTH_KEYS.map(x => 
                    <div className={x.key === this.props.statsKey ? 'selected' : ''}
                         onClick={() => this.props.sendMessage('setStatsKey', x.key)}>
                        <span class="section">{x.name}</span>
                    </div>
                )}
                </div>
                </div>
            </div>
        );
    }
}
 
export default StatsView;