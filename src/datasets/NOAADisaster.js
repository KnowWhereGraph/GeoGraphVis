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


import Dataset from './Dataset';
import { HexagonLayer, HeatmapLayer } from '@deck.gl/aggregation-layers';
import { PolygonLayer } from '@deck.gl/layers';
import Utils from '../util/utils';
import Constant from '../util/constant';

const wkt = require("wellknown");
const geometric = require("geometric");

class NOAADisaster extends Dataset {
    constructor(data) {
        super();
        this._data = NOAADisaster.preprocess(data);
    }
    getData() {
        return this._data.data;
    }
    getTimeInfo() {
        let {t_min, t_max, t_range} = this._data.meta;
        return {t_min, t_max, t_range};
    }
    getTimeHisto(nBins) {
        const bins = super.getTimeHisto(nBins);
        let {t_min, t_range} = this.getTimeInfo();
        t_range *= 1 + 1e-6;

        for (const ele of this.getData()) {
            let a = ~~((ele.start - t_min) / t_range * nBins);
            let b = ~~((ele.end - t_min) / t_range * nBins) + 1;
            for (let i = a; i < b; i++)
                bins[i]++;
        }
        return bins;
    }
    filterTime(ele, currentTime, isAccumulation) {
        if (isAccumulation)
            return ele.start < currentTime;
        else
            return ele.start < currentTime && ele.end > currentTime;
    }
    getStats(return_all) {
        const st = this._data.meta.stats 
        return return_all ? st : st.filter(x => x.key !== undefined);
    }
    getStatInfoByKey(key) {
        const stats = this.getStats(true);
        const o = stats.filter(x => x.key === key);
        return (o.length > 0 ? o : stats)[0];
    }
    getStatNameByKey(key) {
        return this.getStatInfoByKey(key).name;
    }
    getEventTypes(statsKey, return_value) {
        statsKey = statsKey ? statsKey : 'event_#';

        const et = this._data.meta.event_types;
        let ret = et.slice()
            .map(x => ({name: x.name, value: x.values[statsKey]}));
        return return_value ? ret : ret.map(x => x.name);
    }
    getEventTypeOfElement(ele) {
        return ele.event_type_short.value;
    }
    getVisualizations() {
        return {
            hexHisto: {
                key: 'hexHisto',
                name: 'Hexagon Histogram',
                getLayers: (data, args) => {
                    this.__curr_legend = null;
                    
                    return [new HexagonLayer({
                        id: 'impact-heatmap-layer',
                        data,
                        opacity: 0.7,
                        extruded: args.is3d,
                        radius: 30000,
                        elevationScale: 1000,
                        getPosition: d => d.loc,
                        getColorValue: d => d.length,
                        colorDomain: [0, 15],
                        elevationDomain: [0, 20],
                    })];
                }
            },
            heatmap: {
                key: 'heatmap',
                name: 'Heatmap',
                getLayers: (data, args) => {
                    this.__curr_legend = null;

                    return [new HeatmapLayer({
                        id: 'heatmapLayer',
                        data,
                        opacity: 0.7,
                        getPosition: d => d.loc,
                        getWeight: d => 1,
                    })];
                }
            },
            polyHisto: {
                key: 'polyHisto',
                name: 'Choropleth Map by County',
                getLayers: (data, args) => {
                    data = Utils.aggregateData(data, 'event_loc_fips', 'event_loc_label', args.statsKey);
                    const min = data.map(x => x.stat).filter(x => !isNaN(x) && x > -.5).min();
                    const max = data.map(x => x.stat).filter(x => !isNaN(x) && x > -.5).max();
                    const rng = max - min;
                    this.__curr_legend = {min, max};

                    return [new PolygonLayer({
                        id: Constant.LAYER_ID_CHOROP,
                        data,
                        opacity: .7,
                        pickable: true,
                        stroked: true,
                        filled: true,
                        extruded: args.is3d,
                        lineWidthMinPixels: 1,
                        getPolygon: d => d.rec[0].geom,
                        getElevation: d => (d.stat - min) / rng * 4e5,
                        getFillColor: d => d.stat < 0 ? [64,64,64] : [255, Math.max(0, Math.min(255, 255 - ((d.stat - min) / rng) * 255)), 100],
                        getLineColor: [80, 80, 80],
                        getLineWidth: 1,
                    })];
                }
            }
        }
    }
 
    static STAT_KEYS = [
        {
            name: 'Property Damage', 
            key: 'event_impact_damagePropertyResult',
            unit: 'USD', 
            scaled_unit: 'Million USD',
            ratio: 1e6
        }, {
            name: 'Crop Damage', 
            key: 'event_impact_damageCropResult',
            unit: 'USD',
            scaled_unit: 'Million USD',
            ratio: 1e6
        },
        {name: 'Direct Death', key: 'event_impact_deathDirectResult', unit: ''},
        {name: 'Direct Injury', key: 'event_impact_injuryDirectResult', unit: ''},
        {name: 'Indirect Death', key: 'event_impact_deathIndirectResult', unit: ''},
        {name: 'Indirect Injury', key: 'event_impact_injuryIndirectResult', unit: ''},
    ]

    static HEALTH_KEYS = [
        {name: 'Diabetes Rate', topic: 'Diabetes', key: 'health_diabetes', scalar: 100, unit: '%'},
        {name: 'Adult Obesity Rate', topic: 'Obesity', key: 'health_obesity', scalar: 100, unit: '%'},
        {name: 'Mentally Unhealthy Days', topic: 'Mental Health', key: 'health_poor_mental', scalar: 1, unit: ''},
        {name: 'Mental Health Provider Rate', topic: 'Mental Health', key: 'health_mental_provider', scalar: 100, unit: '%'},
        {name: 'Low birthweight Rate', key: 'health_low_birthweight', scalar: 100, unit: '%'},
        {name: 'Uninsured Rate', key: 'health_uninsured', scalar: 100, unit: '%'},
        {name: 'Annual Mammogram Rate', key: 'health_mammogram', scalar: 100, unit: '%'},
        {name: 'Flu Vaccination Rate', key: 'health_flu_vaccine', scalar: 100, unit: '%'},
        {name: 'Food Environment Index', topic: 'Food Security', key: 'health_food_env', scalar: 1, unit: ''},
        {name: 'Injury Deaths', key: 'health_injury_death', scalar: 1, unit: ''},
    ]

    static preprocess(_data) {
        let t_min = Number.MAX_VALUE;
        let t_max = Number.MIN_VALUE;
        let t_range = 0;
        let __event_types = {};
        let [data, hdata] = _data;

        data = data.filter(x => {
            const fips = x.event_loc_fips.value;
            const hstats = hdata[fips];
            if (hstats !== undefined) {
                for (let k in hstats)
                    x[k] = hstats[k];
            }

            if (!x.event_type)
                x.event_type = {value: 'Hurricane'};
            
            const et = x.event_type.value.replaceAll(/.*\//g, '');
            x.event_type_short = { value: et };

            if (__event_types[et] === undefined) {
                __event_types[et] = {
                    'event_#': 0
                };
                for (const i of NOAADisaster.STAT_KEYS)
                    __event_types[et][i.key] = 0;
            }        
            __event_types[et]['event_#']++;
            for (const i of NOAADisaster.STAT_KEYS) {
                if (x[i.key])
                    __event_types[et][i.key] += parseFloat(x[i.key].value);
            }
            
            try {
                let wkt_string = (x.event_loc_wd_geo || x.event_loc_geometrywkt).value;
                let geo = wkt.parse(wkt_string);
                if (geo.type === 'MultiPolygon') {
                    const pa = d => geometric.polygonArea(d);
                    x.geom = geo.coordinates.reduce((a, b) => pa(a[0]) > pa(b[0]) ? a : b);
                } else 
                    x.geom = geo.coordinates;

                x.loc = geometric.polygonCentroid(x.geom[0]);
            } catch (e) {
                return false;
            }

            if ((x.event_time_begin_xsd && x.event_time_end_xsd) || x.event_timeLabel) {
                let est, eet;
                try {
                    est = new Date(x.event_time_begin_xsd.value.replace('+','-')).getTime();
                    eet = new Date(x.event_time_end_xsd.value.replace('+','-')).getTime();
                } catch(e) {
                    est = eet = new Date(x.event_timeLabel.slice(0,13).replaceAt(10,'T') + ':00:00').getTime();
                }
                x.start = est;
                x.end = eet;
                t_min = Math.min(t_min, est - 3.6e6);
                t_max = Math.max(t_max, eet + 3.6e6);
                t_range = t_max - t_min;
            }

            return true;
        });

        let event_types = Object.entries(__event_types)
            .map(([k, v]) => ({ name: k, values: v }))
            .sort((a, b) => a.name > b.name ? 1 : -1);
        
        let stats = [{ name: '# of Reports', total: data.length }]
        for (const o of NOAADisaster.STAT_KEYS) {
            try {
                const total = data
                    .filter(x => x[o.key])
                    .map(x => parseFloat(x[o.key].value))
                    .reduce((a, b) => a + b);
                stats.push({ ...o, total });
            } catch { }
        }
        stats = stats.concat(NOAADisaster.HEALTH_KEYS);

        return { data, meta: {t_min, t_max, t_range, event_types, stats} };
    }
}

export default NOAADisaster