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


import React from 'react'
import { Label, Button, Modal } from 'semantic-ui-react'

function reducer(state, action) {
    switch (action.type) {
        case 'OPEN_MODAL':
            return { open: true, dimmer: action.dimmer }
        case 'CLOSE_MODAL':
            return { open: false }
        default:
            throw new Error()
    }
}

function ExpertWindow(props) {
    const [state, dispatch] = React.useReducer(reducer, {
        open: false,
        dimmer: undefined,
    })
    const { open, dimmer } = state

    React.useEffect(() => {
        const show = props.eid !== null;
        if(show === open)
            return;

        if (show) {
            dispatch({ type: 'OPEN_MODAL', dimmer: 'blurring' });
        } else {
            dispatch({ type: 'CLOSE_MODAL' });
        }
    });

    const onClose = () => props.sendMessage('setExpertId', null);

    const expert_keys = [
        ['Research Interests', 'topics'],
    ];

    const expertCard = expert => (
        <div className='rec-card'>
            <div className='expert-head'>
                {(expert.fullname || expert.name).value}
                {expert.affil.value.split(',').map(d =>
                    <p>{d.trim()}</p>
                )}
                <p>{expert.state.value}</p>
            </div>
            {expert_keys.map(([d, k]) => 
                <div className='stat-item'>
                    <div>{d}</div>
                    <div>
                    {expert[k].value.split(',').sort().map(tag => tag.trim() &&
                        <Label>{tag.trim()}</Label>
                    )}
                    </div>
                </div> 
            )}
            <div className='stat-item'>
                <div>Profile</div>
                <a href={expert.url.value} target='_blank' rel='noreferrer'>
                    Go to Expert's Profile Webpage
                </a>
            </div> 
        </div>
    );
    
    const exp = props.data ? props.data.filter(x => x.expert.value === props.eid)[0] : null;

    return (
        <div>
            <Modal dimmer={dimmer} open={open} onClose={onClose} className="popup-view expert-view">
                <Modal.Header>{exp && (exp.fullname || exp.name).value}</Modal.Header>
            {
                props.eid &&
                <Modal.Content> {exp && expertCard(exp)} </Modal.Content>
            }
                <Modal.Actions>
                    <Button className='ui button gray' onClick={onClose}>
                        Close
                    </Button>
                </Modal.Actions>
            </Modal>
        </div>
    )
}

export default ExpertWindow;