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


import { Component } from 'react';
import rd3 from 'react-d3-library';
import * as d3 from 'd3';
import { Checkbox } from 'semantic-ui-react';
import Constant from '../util/constant';

const margin = {top: 10, right: 0, bottom: 20, left: 40}

function buildNode(data) {
    if (!data)
        return '';

    let node = document.createElement('svg');
    node.setAttribute('class', 'container');

    const n_bins = 120;
    const bins = data.getTimeHisto(n_bins);
    const {t_min, t_range} = data.getTimeInfo();

    const max_v = bins.max();
    const ctn = d3.select(node);
    // const bbox = ctn.node().getBoundingClientRect();
    const bbox = {width: 1000, height: 95};
    const ctn_w = bbox.width - margin.left - margin.right;
    const ctn_h = bbox.height - margin.bottom - margin.top;
    const y_axis = d3.scaleLinear()
        .domain([0, max_v / .9])
        .range([ctn_h, 0]);
    const svg = ctn.html('').append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    svg.append('g')
        .call(d3.axisLeft(y_axis).ticks(4));
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("x", -ctn_h / 2)
        .attr("y", -28)
        .attr("transform", "rotate(-90)")
        .text("# of events");
    var g = svg.append('g')
        .selectAll('g')
        .data(bins).enter().append('g')
        .attr('transform', (d,i) => `translate(${i * (ctn_w / n_bins) + 1},0)`);
    g.append('rect')
        .attr('y', d => 65 -  d * (ctn_h * .9) / max_v)
        .attr('width', ctn_w / n_bins - 2)
        .attr('height', d => d * (ctn_h * .9) / max_v );
    g.append('text')
        .text((d,i) => {
            const dt = new Date((i * t_range / n_bins + t_min));
            if (i % 15 === 0) 
                return '' + (dt.getUTCMonth() + 1) + '/' + dt.getUTCDate() + '-' + dt.getUTCHours() + ':00';
            else 
                return '';
        })
        .attr('y', 82);

    return node;
}

class TimeBar extends Component {
    constructor(props) {
        super(props);
        this.state = { 
            d3_node: '',
            raf: null,
            time: 0,
            speed: 4,
            t_min: 0,
            t_range: 0,
            isAccu: true,
        }
        this.timeScale = 1.8e5;
    }
    filter(ele) {
        const {t_min, time} = this.state;
        return this.props.data.filterTime(ele, t_min + time, this.state.isAccu);
    }
    anim = () => {
        let time = this.state.time + this.state.speed * this.timeScale;
        if (time > this.state.t_range) {
            time = this.state.t_range;
            this.setState({ time });
            this.onPlayPause();
            return;
        }
        let raf = requestAnimationFrame(this.anim);
        this.setState({ time, raf });
    }
    onPlayPause = () => {
        let raf;
        let time = this.state.time;
        if (this.state.raf) {
            cancelAnimationFrame(this.state.raf);
            raf = null;
        } else {
            time = time >= this.state.t_range ? 0 : time;
            raf = requestAnimationFrame(this.anim);
        }
        this.setState({ raf, time });
    }
    onStep(step) {
        let t = this.state.time + step * this.timeScale;
        this.setState({ time: Math.min(Math.max(t, 0), this.state.t_range)});
    }
    onSetSpeed(speed) {
        this.setState({ speed });
    }
    onSelect = (e) => {
        let x = (e.nativeEvent.offsetX - margin.left) / (e.target.clientWidth - margin.left);
        let time = Math.min(Math.max(x, 0), 1) * this.state.t_range;
        this.setState({ time });
    }
    onAccuToggle = () => {
        this.setState((prevState) => ({ isAccu: !prevState.isAccu }));
    }
    getIndicatorWidth = (scale) => {
        return this.state.time * scale / this.state.t_range;
    }
    componentDidMount() {
        const {t_min, t_range} = this.props.data.getTimeInfo(); 
        this.setState({ 
            d3_node: buildNode(this.props.data),
            t_min, t_range,
            time: t_range
        });
    }
    componentWillUnmount() {
        if (this.state.raf)
            cancelAnimationFrame(this.state.raf);
    }
    componentDidUpdate(prevProps, prevState, snapshot) {
        const {time, isAccu} = this.state;
        if (time !== prevState.time || isAccu !== prevState.isAccu)
            this.props.sendMessage('filter');
    }
    buildTimeRange() {
        const data = this.props.data;
        if (!data)
            return '';

        try {
            let {t_min, t_max} = data.getTimeInfo();
            let f = t => new Date(t).toISOString().slice(0, -8);
            return `${f(t_min)}Z - ${f(t_max)}Z`;
        } catch(e) {
            return '';
        }
    }
    render() { 
        let enabled = !this.props.statsKey || this.props.statsKey.startsWith(Constant.IMPACT_LAYER_PREFIX);
        enabled = true;

        return (  
            <div className={`timebar ${enabled ? '' : 'disabled'}`}>
                {
                    this.state.raf === null ?
                    <i className="play-ctrl mdi mdi-play"  onClick={this.onPlayPause}></i> :
                    <i className="play-ctrl mdi mdi-pause" onClick={this.onPlayPause}></i>
                }
                <div className="range">Hurricane&nbsp;
                    <i className="storm-name">{this.props.stormName}</i>　|　
                    {this.buildTimeRange()}
                </div>
                <div onClick={this.onSelect}>
                    <rd3.Component data={this.state.d3_node} />
                </div>
                <div className="meter" style={{ width: this.getIndicatorWidth(960) }}></div>
                <div className="speeder">
                    {[1, 4, 16].map(x => 
                        <div className={this.state.speed===x ? 'sel' : ''} 
                             onClick={() => this.onSetSpeed(x)} >
                            {x}x
                        </div>
                    )}
                </div>
                <div className="step">
                    <i className="mdi mdi-rotate-left"  onClick={() => this.onStep(-200)}></i>
                    <i className="mdi mdi-rotate-right" onClick={() => this.onStep( 200)}></i>
                </div>
                <div className="accu-toggle">
                    <span>Using Accumulation</span>
                    <Checkbox toggle onChange={this.onAccuToggle} checked={this.state.isAccu} />
                </div>
                <div className='text-disabled'>Not Applicable for This Data Layer</div>
            </div>
        );
    }
}
 
export default TimeBar;