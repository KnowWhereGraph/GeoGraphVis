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
import { Button } from 'semantic-ui-react';
import ReactGA from 'react-ga4';

import Logo from './components/logo';
import Map from './components/map';
import Toolbar from './components/toolbar';
import Omnibar from './components/omnibar';
import TimeBar from './widget/timebar';
import SparqlQuery from './util/query';
import Utils from './util/utils';
import ScatterPlotView from './widget/scatterplot';
import CategoryView from './widget/categoryview';
import StatsView from './widget/statsView';
import LegendView from './widget/legendView';
import ExpertView from './widget/expertView';
import ImpactDetailWindow from './popup/ImpactDetailWindow';
import ExpertWindow from './popup/ExpertWindow';
import ExpertListWindow from './popup/ExpertListWindow';
import Widget from './widget/widget';

let storm_list = null;
let history = [];

class App extends Component {
    constructor(props) {
        super(props);
        this.initState = {
            is3d: false,
            loading: false,
            stage: Utils.buildStage(1),
            stormName: '',
            drawnImpactArea: null,
            rawData: null,
            filteredData: null,
            impactStates: [],
            statsKey: undefined, //'event_impact_damagePropertyResult',
            visualizationKey: null,
            impactDetailData: null,
            enableExperts: false,
            expertData: null,
            expertId: null,
            showExpertList: false,
        };
        this.state = {...this.initState};

        this.widgets = {
            timebar: React.createRef(),
            scatterplot: React.createRef(),
            categoryView: React.createRef(),
            expertView: React.createRef(),
        }
    }
    componentDidMount() {
        this.showHistoricalData();
    }
    showHistoricalData = () => {
        if (storm_list === null) {
            SparqlQuery.stormList(data => {
                storm_list = data;
                this.setState({stage: Utils.buildStage(1)});
            });
        } else 
            this.setState({stage: Utils.buildStage(1)});
    }
    showUpcomingEvent = () => {
        this.setCheckpoint();
        this.setState({stage: Utils.buildStage(2, 1)});
    }
    setCheckpoint() {
        history.push(this.state);
    }
    filterData(data) {
        data = data || this.state.rawData;
        return data ? data.getData().filter(x => {
            for (const w of Object.values(this.widgets))
                if (w.current && w.current.filter && !w.current.filter(x))
                    return false;
            return true;
        }) : null;
    }
    sendMessage = (msg, data) => {
        switch (msg) {
            case 'reset':
                this.setState(this.initState);
                history = [];
                break;
            case 'back':
                let state = history.pop();
                this.setState(state);
                break;
            case 'loading':
                this.setState({loading: data});
                break;
            case 'view':
                this.setState({is3d: data});
                break;
            case 'checkpoint':
                this.setCheckpoint();
                break;
            case 'setStage':
                this.setState({ stage: data });
                break;
            case 'setStorm':
                this.setState({ stormName: data });
                ReactGA.event({
                    category: 'Interaction',
                    action: 'select storm',
                    label: data
                });
                break;
            case 'drawImpactArea':
                this.setState({ drawnImpactArea: {
                    type: "FeatureCollection",
                    features: []
                } });
                break;
            case 'setDrawnImpactArea':
                this.setState({ drawnImpactArea: data });
                break;
            case 'setImpactStates':
                this.setState({ impactStates: data });
                break;
            case 'setData':
                this.setState({ 
                    rawData: data,
                    filteredData: this.filterData(data)
                });
                break;
            case 'filter':
                this.setState({ filteredData: this.filterData() });
                break;
            case 'visualize':
                this.sendMessage('foldAllWidgets', true);
                this.forceUpdate(() => {
                    this.widgets.scatterplot.current.setFold(false);
                    this.widgets.categoryView.current.setFold(false);
                });
                if (data) {
                    this.setState({ visualizationKey: data });
                    ReactGA.event({
                        category: 'Interaction',
                        action: 'select visualization',
                        label: data
                    });
                }
                break;
            case 'setStatsKey':
                this.setState({ statsKey: data });
                break;
            case 'setImpactDetail':
                this.setState({ impactDetailData: data });
                break;
            case 'enableExperts':
                if (data) {
                    if (Array.isArray(data))
                        SparqlQuery.experts(data, null, res => {
                            this.setState({ enableExperts: true, expertData: res });
                        });
                    else
                        this.widgets.expertView.current.showExclusively();
                } else {
                    this.setState({ enableExperts: data });
                    this.sendMessage('visualize', null);
                }
                break;
            case 'setExpertId':
                this.setState({ expertId: data });
                break;
            case 'showExpertList':
                this.setState({ showExpertList: data });
                break;
            case 'foldAllWidgets':
                for (const w of Object.values(this.widgets))
                    if (w.current instanceof Widget)
                        w.current.setFold(data);
                break;
            default:
                break;
        }
    }
    render() {
        return (
            <div className="App">
                {this.state.loading && <div className="loader">Loading Data...</div>}

                <div className='ext-links'>
                    <a href='https://knowwheregraph.org/' target='_blank' rel="noreferrer">
                        About KnowWhereGraph
                    </a>
                    <a href='https://form.jotform.com/221507217699058' target='_blank' rel="noreferrer">
                        Your Feedback
                    </a>
                </div>

                {/* <div class="demo-link">Live System: http://cici.lab.asu.edu/kwg/vis</div> */}
                <Logo />
                <Omnibar 
                    stormList={storm_list} 
                    stormName={this.state.stormName}
                    stage={this.state.stage} 
                    enableExperts={this.state.enableExperts}
                    statsKey={this.state.statsKey}
                    sendMessage={this.sendMessage}
                    data={this.state.rawData} />
                <Map 
                    is3d={this.state.is3d}
                    stormName={this.state.stormName}
                    stage={this.state.stage} 
                    data={this.state.filteredData}
                    visKey={this.state.visualizationKey}
                    statsKey={this.state.statsKey}
                    enableExperts={this.state.enableExperts}
                    expertData={this.state.expertData}
                    drawnImpactArea={this.state.drawnImpactArea}
                    sendMessage={this.sendMessage} />
                {
                    Utils.parseStage(this.state.stage).main === '0' &&
                    <div className="route-selector">
                        <Button className='blue' content='Upcoming Hurricane' onClick={this.showUpcomingEvent}/>
                        <Button className='gray' content='Historical Storms' onClick={this.showHistoricalData}/>
                    </div>
                } {
                    (Utils.parseStage(this.state.stage).main === '3' && this.state.rawData !== null) &&
                    <div>
                        <TimeBar ref={this.widgets.timebar}
                            stormName={this.state.stormName}
                            statsKey={this.state.statsKey}
                            data={this.state.rawData} 
                            sendMessage={this.sendMessage} />
                        <div className="left-container">
                            <ExpertView ref={this.widgets.expertView}
                                title="Find Experts..." 
                                enableExperts={this.state.enableExperts}
                                sendMessage={this.sendMessage} />
                            <ScatterPlotView ref={this.widgets.scatterplot} 
                                title="2-Variable Scatter Plot"
                                data={this.state.rawData}
                                statsKey={this.state.statsKey}
                                sendMessage={this.sendMessage} 
                                categoryEnabled={this.widgets.categoryView.current && this.widgets.categoryView.current.state.enabled} />
                            <CategoryView ref={this.widgets.categoryView} 
                                data={this.state.rawData}
                                statsKey={this.state.statsKey}
                                sendMessage={this.sendMessage} />
                        </div>
                        <div className="right-container">
                            <StatsView 
                                stormName={this.state.stormName}
                                data={this.state.rawData} 
                                statsKey={this.state.statsKey} 
                                sendMessage={this.sendMessage} />
                            {(this.state.visualizationKey &&
                            <LegendView  
                                data={this.state.rawData}
                                statsKey={this.state.statsKey}
                                visKey={this.state.visualizationKey} />)}
                        </div>
                    </div>
                }
                <ImpactDetailWindow 
                    data={this.state.impactDetailData}
                    sendMessage={this.sendMessage} />
                <ExpertWindow 
                    eid={this.state.expertId}
                    data={this.state.expertData}
                    sendMessage={this.sendMessage} />
                <ExpertListWindow 
                    show={this.state.showExpertList}
                    data={this.state.expertData}
                    local={this.state.impactStates}
                    sendMessage={this.sendMessage} />
                <Toolbar
                    is3d={this.state.is3d} 
                    sendMessage={this.sendMessage} />
            </div>
        );
    }
}

export default App;