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
import { Menu, Button } from 'semantic-ui-react'


class Toolbar extends Component {
    constructor(props) {
        super(props);
        this.state = { }
    }
    onHome = () => {
        this.props.sendMessage('reset');
    }
    onView = (e) => {
        let is3d = !this.props.is3d;
        this.props.sendMessage('view', is3d);
        e.target.blur();
    }
    render() { 
        return ( 
        <Menu className="toolbar mini inverted">
            <Menu.Item>
                <Button className='inverted yellow' content='Reset Camera'/>
            </Menu.Item>
            { this.props.is3d ? <Menu.Item>
                <Button className='inverted green' content='3D View' onClick={this.onView}/>
            </Menu.Item> : <Menu.Item>
                <Button className='inverted red'   content='2D View' onClick={this.onView}/>
            </Menu.Item> }
            <Menu.Item position='right'>
                <Button className='blue' content='Home' onClick={this.onHome}/>
            </Menu.Item>
        </Menu>
        );
    }
}
 
export default Toolbar;