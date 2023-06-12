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


import chroma from "chroma-js";
import * as d3 from 'd3';

class Constant {

    static RPL_PH = '__KWG_STR_PLACEHOLDER__';
    static VAL_NA = 'N/A';

    static MAP_TOKEN = 'pk.eyJ1Ijoic2E5dXMiLCJhIjoiY2s5YWxsOHY0MDI1eTNtbXh5bGZlb3VzZyJ9.K1ORjD7xw_ne5MbvbaS1uQ';
    static MAP_STYLE = 'mapbox://styles/mapbox/dark-v10?optimize=true';
    
    static PITCH_2D = 0;
    static PITCH_3D = 60;
    static VIEW_STATE_2D = {
        longitude: -90,
        latitude: 32,
        zoom: 4,
        pitch: this.PITCH_2D,
        bearing: 0
    };
    static VIEW_STATE_3D = {
        longitude: -90,
        latitude: 36,
        zoom: 4,
        pitch: this.PITCH_3D,
        bearing: 0
    };

    static IMPACT_LAYER_PREFIX = 'event_impact_';
    static HEALTH_LAYER_PREFIX = 'health_';

    static LAYER_ID_LANDFALL = 'landfallLayer';
    static LAYER_ID_CHOROP = 'choroplethLayer';
    static LAYER_ID_EXPERT = 'expertLayer';
    static LAYER_ID_DRAW = 'drawAreaLayer';

    static COLOR_CAT10 = ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd','#8c564b','#e377c2','#7f7f7f','#bcbd22','#17becf'];
    static COLOR_CAT10_2 = this.COLOR_CAT10.map(x => chroma(x).brighten(1.5).saturate(.5).hex());
    static SYMBOL_CAT10 = [
        d3.symbolCircle,
        d3.symbolCross,
        d3.symbolDiamond,
        d3.symbolSquare,
        d3.symbolStar,
        d3.symbolTriangle,
        d3.symbolWye, { 
            draw: (context, size) => {  //rightTriangle
                let s = Math.sqrt(size/4);
                context.moveTo(-s, s*2)
                context.lineTo(s*2, -s);
                context.lineTo(-s, -s);
                context.closePath();
            }
        }, { 
            draw: (context, size) => {  //semiCircle
                let r = Math.sqrt(2 * size / Math.PI);
                let orgin = (4 * r) / (3 * Math.PI); //the orgin of the circle, not of the symbol
                context.arc(0, -orgin, r, Math.PI, 2 * Math.PI, true);
                context.closePath();
            }
        }, { 
            draw: (context, size) => {  //Triangle that rotates 180deg
                let s = Math.sqrt(size) / 1.3;
                context.moveTo(-s, -Math.sqrt(3) / 2 * s)
                context.lineTo( 0,  Math.sqrt(3) / 2 * s);
                context.lineTo( s, -Math.sqrt(3) / 2 * s);
                context.closePath();
            }
        },
    ];

    static TERM_MAPPTING = {
        'TS': 'Tropical Storm',
        'H1': 'Hurricane 1',
        'H2': 'Hurricane 2',
        'H3': 'Hurricane 3',
        'H4': 'Hurricane 4',
        'H5': 'Hurricane 5',
        'HectoPA': 'hPa',
        'KN': 'Knot',
    }
    static __hurr_list = ['michael 2018','katrina 2005','ivan 2004','sandy 2012','irma 2017','ike 2008','harvey 2017','florence 2018','wilma 2005'];
    static __hurr_info = {
        'Katrina': {'landfall': [-89.6000015,29.2505200], 'year': 2005},
        'Harvey': {'landfall': [-96.958975,27.958975], 'year': 2017},
        'Maria': {'landfall': [-65.833561,18.029752], 'year': 2017},
        // 'Irma': {'landfall': [-81.72675663,25.90702569], 'year': 2017},
        'Sandy': {'landfall': [-74.705179,39.105187], 'year': 2012},
        'Ike': {'landfall': [-94.779794,29.296248], 'year': 2008},
        // 'Wilma': {'landfall': [-81.715030,25.898851], 'year': 20},
        'Ivan': {'landfall': [-87.834263,30.363034], 'year': 2004},
        'Michael': {'landfall': [-85.6049764,30.0583762], 'year': 2018},
        'Florence': {'landfall': [-77.890361,34.036555], 'year': 2018},
        // 'Ida': {'landfall': [-90.245015,29.085856], 'year': 20},
        'Ian': {'landfall': [-82.3, 26.6], 'year': 2022},
    }
    static IL_DATA = Object.entries(this.__hurr_info).map(([k, v]) => ({name: k, coordinates: v.landfall, year: v.year}));

    static OB_PLACEHOLDER = [
        ['Select Scenario Below...'],
        ['Type or Select a Storm...'],
        [
            `The Consequential Impact by ${this.RPL_PH}...`,
            'Draw Appoximate Hurricane Impact Area...'
        ],
        [`More Details about ${this.RPL_PH}...`]
    ];
    static EXPERT_KEYS = [
        '__expert_disabled',
        '__expert_enabled'
    ];
    static DEF_OPTIONS = [
        { title: '⬅️　Go Back', action: `props => {props.sendMessage('back')}` }, 
        { title: '🏠　Home', action: `props => {props.sendMessage('reset')}` }
    ];
    static STG_OPTIONS = {
    '2': [
        { title: `Show the Consequential Impact by ${this.RPL_PH}`, action: `props => {
            props.sendMessage('checkpoint');
            props.sendMessage('setStage', '3');
        }` },
        { title: `Show the Storms near the Landfall Location of ${this.RPL_PH} (not yet available)`, action: `props => {

        }` },
        ...this.DEF_OPTIONS
    ],
    '2-1': [
        { title: `Draw Appoximate Hurricane Impact Area`, action: `props => {
            props.sendMessage('drawImpactArea');
        }` },
        { title: `Show the Historical Impact Records in Drawn Area`, action: `props => {
            props.sendMessage('checkpoint');
            props.sendMessage('setStage', '3');
        }` },
        ...this.DEF_OPTIONS
    ],
    '3': [
        // { title: `Show the Most Impactful Event Records of ${this.RPL_PH}`, action: `props => {
            
        // }` },
        // { title: `Show Event Records of ${this.RPL_PH} within Selected States`, action: `props => {

        // }` },
        ...this.DEF_OPTIONS
    ],
    '__expert_disabled': [
        { title: `📚　Find Related Experts with Expertise of ${this.RPL_PH}`, action: `props => {
            props.sendMessage('enableExperts', true);
        }` },
    ],
    '__expert_enabled': [
        { title: `📚　Show List of Experts`, action: `props => {
            props.sendMessage('showExpertList', true);
        }` },
        { title: `📚　Hide Expert Layer`, action: `props => {
            props.sendMessage('enableExperts', false);
        }` },
    ]
    };
}

export default Constant;