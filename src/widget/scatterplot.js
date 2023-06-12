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


import rd3 from 'react-d3-library';
import * as d3 from 'd3';
import Constant from '../util/constant';
import Utils from '../util/utils';
import Widget from './widget';

const CLA_ID = '__KWGVIS_SCP_POINT'

class ScatterPlotView extends Widget {
    constructor(props) {
        super(props);
        this.state = { 
            ...this.state,
            d3_node: '',
            selection: {
                x_stats: { name: 'x_stats', value: 0 },
                y_stats: { name: 'y_stats', value: 6 },
                x_scalar: { name: 'x_scalar', value: 0 },
                y_scalar: { name: 'y_scalar', value: 0 },
            },
            brush_extent: [[0,0],[0,0]],
            title: props.title || '',
        }
        this.stats = [];
        this.scalar = [
            {name: 'Linear'},
            {name: 'Log'}
        ]
    }
    buildNode() {
        const rawdata = this.props.data && this.props.data.getData();
        if (!rawdata)
            return '';

        const st = this.stats;
        const et = this.props.data.getEventTypes();
        const islog = {
            x: this.state.selection.x_scalar.value,
            y: this.state.selection.y_scalar.value }
        const obj = {
            x: st[this.state.selection.x_stats.value],
            y: st[this.state.selection.y_stats.value] }
        const txt = { x: obj.x.name, y: obj.y.name }
        const ax = { x: obj.x.key, y: obj.y.key }

        const data = rawdata.filter(x => 
            x[ax.x] && (!islog.x || x[ax.x].value > 0) && 
            x[ax.y] && (!islog.y || x[ax.y].value > 0)
        ).map(x => {
            x[ax.x].log_v = Math.log10(parseFloat(x[ax.x].value) + 1);
            x[ax.y].log_v = Math.log10(parseFloat(x[ax.y].value) + 1);
            return x;
        });

        let ranges = {};
        let ticks = {};
        for (const i of ['x', 'y']) {
            let k = ax[i];
            let _islog = islog[i];
            let vmin = data.map(x => x[k][_islog ? 'log_v' : 'value']).min();
            let vmax = data.map(x => x[k][_islog ? 'log_v' : 'value']).max();
            let vrng = vmax - vmin;
            vmin -= vrng * .05;
            vmax += vrng * .05;
            ranges[i] = [vmin, vmax];

            if (_islog) {
                ticks[i] = [];
                for (let j = ~~vmin + 1; j < ~~vmax + 1; j++)
                    ticks[i].push(j);
            }
        }

        let margin = {top: 10, right: 30, bottom: 35, left: 40},
            width = 320 - margin.left - margin.right,
            height = 320 - margin.top - margin.bottom;
    
        let node = document.createElement('svg');
        let svg = d3.select(node)
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // Add X axis
        let x = d3.scaleLinear()
            .domain(ranges.x)
            .range([ 0, width ]);
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(
                d3.axisBottom(x)
                    [islog.x ? 'tickValues' : 'ticks'](islog.x ? ticks.x : 8)
                    .tickFormat((d,i) =>  Utils.formatDecimal((islog.x ? Math.pow(10, d) : d) / (obj.x.ratio || 1) * (obj.x.scalar || 1)))
            );
        svg.append("text")
            .attr("class", "axis-label")
            .attr("text-anchor", "middle")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom - 5)
            .text(`${txt.x} (${obj.x.scaled_unit || obj.x.unit})`);

        // Add Y axis
        let y = d3.scaleLinear()
            .domain(ranges.y)
            .range([ height, 0]);
        svg.append("g")
            .call(
                d3.axisLeft(y)
                    [islog.y ? 'tickValues' : 'ticks'](islog.y ? ticks.y : 8)
                    .tickFormat((d,i) => Utils.formatDecimal((islog.y ? Math.pow(10, d) : d) / (obj.y.ratio || 1) * (obj.y.scalar || 1)))
            );
        svg.append("text")
            .attr("class", "axis-label")
            .attr("text-anchor", "middle")
            .attr("x", -height / 2)
            .attr("y", -margin.left + 10)
            .attr("transform", "rotate(-90)")
            .text(`${txt.y} (${obj.y.scaled_unit || obj.y.unit})`);

        // compute chart coords
        for (const n of rawdata) {
            let cx = n[ax.x] && (!islog.x || n[ax.x].value > 0) ? 
                x(n[ax.x][islog.x ? 'log_v' : 'value']) : undefined;
            let cy = n[ax.y] && (!islog.y || n[ax.y].value > 0) ? 
                y(n[ax.y][islog.y ? 'log_v' : 'value']) : undefined;
            n[CLA_ID] = {cx, cy};
        }
        
        // plot data points
        svg.append('g')
            .attr("class", "plot-area")
            .selectAll("path")
            .data(data)
            .enter()
            .append("path")
                .attr("class", CLA_ID)
                .attr("transform", d => `translate(${d[CLA_ID].cx}, ${d[CLA_ID].cy})`)
                .classed("disabled", d => {
                    const type = this.props.data.getEventTypeOfElement(d);
                    return this.props.categoryEnabled && !this.props.categoryEnabled[type];
                })
                .attr("d", d => {
                    const ind = et.indexOf(this.props.data.getEventTypeOfElement(d));
                    const symlen = Constant.SYMBOL_CAT10.length;
                    return d3.symbol().size(50).type(Constant.SYMBOL_CAT10[ind % symlen])();
                });
        
        svg.call( 
            d3.brush()
                .extent( [[0,0], [width,height]] )
                .on("start brush", (e) => {
                    this.setState({ brush_extent: e.selection });
                }) 
                .on("end", (e) => {
                    const extent = e.selection;
                    d3.selectAll(`path.${CLA_ID}`).classed("selected", d => 
                        isBrushed(extent, d[CLA_ID].cx, d[CLA_ID].cy) 
                    );
                }) 
        );

        let isBrushed = (extent, cx, cy) => {
            try {
                const [[x0, y0], [x1, y1]] = extent;
                return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1; 
            } catch {
                return false;
            }
        }
        isBrushed([[0,0],[0,0]], 0, 0);

        return node;
    }
    filter(ele) {
        const [[x0, y0], [x1, y1]] = this.state.brush_extent;
        if ( (x0 === x1 && y0 === y1) || !ele[CLA_ID] )
            return true;
        const {cx, cy} = ele[CLA_ID];
        return cx !== undefined && cy !== undefined && x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
    }
    updateChart() {
        this.setState({ d3_node: this.buildNode() });
    }
    onChange = (e) => {
        const {name, selectedIndex} = e.target;
        const selection = this.state.selection;
        selection[name].value = selectedIndex;
        this.updateChart();
    }
    componentDidMount() {
        this.stats = this.props.data.getStats(); //.reduce((a, x) => ({...a, [x.name]: x}), {});
        this.updateChart();
    }
    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.categoryEnabled && prevProps.categoryEnabled) {
            for (const k in this.props.categoryEnabled) {
                if (this.props.categoryEnabled[k] !== prevProps.categoryEnabled[k]) {
                    this.updateChart();
                    break;
                }
            }
        }

        const [[a, b], [c, d]] = prevState.brush_extent;
        const [[A, B], [C, D]] = this.state.brush_extent;
        if (a !== A || b !== B || c !== C || d !== D)
            this.props.sendMessage('filter');
    }
    subrender() {
        return ( 
        <div className="brush-chart scatterplot" >
            <div className="brush-chart-title">
                <i className="mdi mdi-chart-scatter-plot"></i> 
                2-Factor Scatter Plot
            </div>
            <div className="brush-chart-chart">
                <div className="info">
                    {['x', 'y'].map(ax =>
                        <div className={`selector ${ax}-axis`}>
                            <span>{ax}-axis</span>
                            {['stats', 'scalar'].map(sel =>
                                <select className={sel} {...this.state.selection[`${ax}_${sel}`]} 
                                        onChange={this.onChange}>
                                    { this[sel].map((x, i) => 
                                        <option value={i}>{x.name}</option>
                                    ) }
                                </select>
                            )}
                        </div>
                    )}
                </div>
                <div className="chart">
                    <rd3.Component data={this.state.d3_node} />
                </div>
            </div>
        </div>
        );
    }
}
 
export default ScatterPlotView;