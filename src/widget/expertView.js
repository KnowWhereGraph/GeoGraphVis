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


import { Checkbox, Button } from "semantic-ui-react";
import NOAADisaster from "../datasets/NOAADisaster";
import Widget from "./widget";

class ExpertView extends Widget {
    constructor(props) {
        super(props);
        this.state = {
            ...this.state,
            folded: true,
            title: props.title || '',
            topics: {}
        }

        const health_factors = [...new Set(NOAADisaster.HEALTH_KEYS.map(x => x.topic).filter(x => x))];
        this.expertises = [
            { category: 'Disaster', topics: ['Hurricane'] },
            { category: 'Health', topics: health_factors }
        ];
        for (const {category, topics} of this.expertises)
            for (const topic of topics)
                this.state.topics[`${category}:${topic}`] = false;
        this.state.topics['Disaster:Hurricane'] = true;
    }
    onToggle(key) {
        return () => {
            const topics = {...this.state.topics};
            topics[key] = !topics[key];
            this.setState( {topics} );
        }
    }
    onSearch = () => {
        const exp = [];
        for (const {category, topics} of this.expertises)
            for (const topic of topics)
                if (this.state.topics[`${category}:${topic}`])
                    exp.push(topic);
        this.props.sendMessage('enableExperts', exp);
    }
    subrender() { 
        return (
        <div className="expert-view">
            { this.expertises.map(({category, topics}) => 
            <div className="exp-group">
                <p>with <i>{category}</i> related expertises</p>
                { topics.map(topic => 
                    <Checkbox label={topic} onChange={this.onToggle(`${category}:${topic}`)}
                        checked={this.state.topics[`${category}:${topic}`]} />
                )}
            </div>
            )}
            <div className="btn-group">
                <Button className="mini green" content="Show List" 
                    disabled={!this.props.enableExperts} 
                    onClick={() => this.props.sendMessage('showExpertList', true)} />
                <Button className="mini red" content="Hide on Map" 
                    disabled={!this.props.enableExperts} 
                    onClick={() => this.props.sendMessage('enableExperts', false)} />
                <Button className="mini blue" content="Search" 
                    onClick={this.onSearch}/>
            </div>
        </div>
        );
    }
}
 
export default ExpertView;