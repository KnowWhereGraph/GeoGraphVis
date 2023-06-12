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


import _ from 'lodash';
import React from 'react';
import { Search } from 'semantic-ui-react'
import NOAADisaster from '../datasets/NOAADisaster';
import Constant from '../util/constant';
import Utils from '../util/utils';

const initialState = {
    loading: false,
    open: false,
    results: [],
    value: '',
}

function reducer(state, action) {
    switch (action.type) {
        case 'CLEAN_QUERY':
            return initialState
        case 'START_SEARCH':
            return { ...state, loading: true, value: action.query }
        case 'FINISH_SEARCH':
            return { ...state, loading: false, results: action.results }
        case 'UPDATE_SELECTION':
            return { ...state, value: action.selection }
        case 'ENABLE_RESULTS':
            return { ...state, open: action.open }
        default:
            throw new Error()
    }
}
function setPlaceholder(stage, name) {
    stage = Utils.parseStage(stage);
    name = Utils.renderStormName(name);
    return Utils.buildStringFromTempl(Constant.OB_PLACEHOLDER[stage.main][stage.sub], name);
}

function Omnibar(props) {
    const [state, dispatch] = React.useReducer(reducer, initialState);
    const { loading, results, value, open } = state;
    const searchRef = React.useRef();

    React.useEffect(() => {
        let stage = Utils.parseStage(props.stage);
        switch (stage.main) {
            case '1':
                searchRef.current.source = props.stormList;
                break;
            case '2':
                let name = Utils.renderStormName(props.stormName);
                searchRef.current.source = Constant.STG_OPTIONS[props.stage].map(x => ({...x,
                    title: Utils.buildStringFromTempl(x.title, name)
                }));
                break;
            case '3':
                let name3 = Utils.renderStormName(props.stormName);
                let topics = ['Hurricane'];
                let health_topic = NOAADisaster.HEALTH_KEYS.filter(x => x.topic && x.key === props.statsKey);
                if (health_topic)
                    topics = [...topics, ...health_topic.map(x => x.topic)];
                topics = topics.join(' and ');

                let options = [
                    ...(props.data ?
                        Object.values(props.data.getVisualizations()).map(x => ({
                            title: `🌎　Visualize the Impact of ${Constant.RPL_PH} with a ${x.name}.`,
                            action: `props => {props.sendMessage('visualize', '${x.key}')}`
                    })) : []),
                    ...Constant.STG_OPTIONS[Constant.EXPERT_KEYS[props.enableExperts ? 1 : 0]].map(x => ({...x,
                        title: Utils.buildStringFromTempl(x.title, topics)
                    })),
                    ...Constant.STG_OPTIONS[stage.main]
                ]
                searchRef.current.source = options.map(x => ({...x,
                    title: Utils.buildStringFromTempl(x.title, name3)
                }));
                break;
            default:
                break;
        }
    });
    
    const onFocus = (e, data) => {
        dispatch({ type: 'ENABLE_RESULTS', open: true });
        onSearchChange(e, data);
    }
    const onBlur = (e, data) => {
        dispatch({ type: 'ENABLE_RESULTS', open: false });
    }
    const onSelect = (e, data) => {
        dispatch({ type: 'CLEAN_QUERY' });
        e.target.parentElement.parentElement.firstChild.firstChild.blur();

        let stage = Utils.parseStage(props.stage);
        switch (stage.main) {
            case '1':
                props.sendMessage('checkpoint');
                props.sendMessage('setStage', Utils.buildStage(2));
                props.sendMessage('setStorm', data.result.name.value);
                break;
            case '2':
            case '3':
                eval(data.result.action)(props);
                break;
            default:
                break;
        }
    }
    const onSearchChange = React.useCallback((e, data) => {
        dispatch({ type: 'START_SEARCH', query: data.value });

        if (data.value.length === 0) {
            dispatch({ type: 'FINISH_SEARCH', results: searchRef.current.source });
            return;
        }

        const re = new RegExp(_.escapeRegExp(data.value), 'i');
        const isMatch = (result) => re.test(result.title);

        dispatch({
            type: 'FINISH_SEARCH',
            results: _.filter(searchRef.current.source, isMatch),
        })
    }, []);
     
    return ( 
        <Search
            ref={searchRef} className='omnibar' icon='angle right'
            placeholder={setPlaceholder(props.stage, props.stormName)}
            loading={loading}
            open={open}
            onFocus={onFocus}
            onBlur={onBlur}
            onResultSelect={onSelect}
            onSearchChange={onSearchChange}
            results={results}
            value={value} 

            resultRenderer={ 
                (Utils.parseStage(props.stage).main !== '1') ? 
                ({ title }) => title :
                ({ title, time, windSpeed, pressure, category }) => 
                    <div className="ob-item">
                        <p>{title}</p>
                        <div>
                            <div><span>Category: </span>{Utils.termTranslate(category.value)}</div>
                            <div><span>Max Wind Speed: </span>{windSpeed.value} {Utils.parseUnit(windSpeed.datatype)}</div>
                            <div><span>Min Pressure: </span>{pressure.value} {Utils.parseUnit(pressure.datatype)}</div>
                        </div>
                    </div>
            }
        />
    );
}
 
export default Omnibar;