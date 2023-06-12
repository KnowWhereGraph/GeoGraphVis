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

class Widget extends Component {
    constructor(props) {
        super(props);
        this.state = {
            folded: true,
            title: ''
        }
    }
    onTitleClick = () => {
        const folded = !this.state.folded;
        this.setState({ folded });
    }
    setTitle(title) {
        if (this.state.title !== title)
            this.setState({ title })
    }
    setFold(folded) {
        if (this.state.folded !== folded)
            this.setState({ folded })
    }
    showExclusively = () => {
        this.props.sendMessage('foldAllWidgets', true);
        this.setState({ folded: false });
    }
    subrender() {
        return <div></div>;
    }
    render() { 
        return (
            <div className={"widget-view" + (this.state.folded ? " folded" : "")}>
                <p onClick={this.onTitleClick}  >
                    <span>{this.state.folded ? '▶' : '▼'}</span>
                    {this.state.title}
                </p>
                { this.subrender() }
                <span className='mdi mdi-unfold-more-horizontal' onClick={this.showExclusively}></span>
            </div>
        );
    }
}
 
export default Widget;