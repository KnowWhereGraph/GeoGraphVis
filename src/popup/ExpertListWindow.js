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
import { Button, Modal, Segment, Grid, Divider, Header, Icon } from 'semantic-ui-react'

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

function ExpertListWindow(props) {
    const [state, dispatch] = React.useReducer(reducer, {
        open: false,
        dimmer: undefined,
    })
    const { open, dimmer } = state

    React.useEffect(() => {
        const show = props.show;
        if(show === open)
            return;

        if (show) {
            dispatch({ type: 'OPEN_MODAL', dimmer: 'blurring' });
        } else {
            dispatch({ type: 'CLOSE_MODAL' });
        }
    });

    const onClose = () => props.sendMessage('showExpertList', false);
    const onExpClick = id => () => props.sendMessage('setExpertId', id);

    const _patt = new RegExp(`(${props.local.join('|')})`, 'gi');
    const local_exp = props.data && props.data.filter(x => x.state.value.match(_patt));
    const global_exp= props.data && props.data.filter(x => !x.state.value.match(_patt));

    const expertCard = expert => (
        <div className='rec-card'>
            <div className='expert-head'>
                <div className='expert-name' onClick={onExpClick(expert.expert.value)}>
                    {(expert.fullname || expert.name).value}
                </div>
                {expert.affil.value.split(',').map(d =>
                    <p>{d.trim()}</p>
                )}
                <p>{expert.state.value}</p>
            </div>
            <div className='stat-item'>
                <div>Profile</div>
                <a href={expert.url.value} target='_blank' rel='noreferrer'>
                    Go to Expert's Profile Webpage
                </a>
            </div> 
        </div>
    );

    return (
        <div>
            <Modal dimmer={dimmer} open={open} onClose={onClose}>
                <Modal.Header>Expert List</Modal.Header>
            {
                props.data &&
                <Modal.Content><Segment vertical>
                <Grid className='popup-view expert-view' columns={2} relaxed='very'>
                    <Grid.Column width={8}>
                        <Divider horizontal>
                            <Header as='h4' color='red'>
                                <Icon name='user md' />
                                Experts (Local)
                            </Header>
                        </Divider>
                        <div className='experts'>
                        { local_exp && local_exp.length > 0 ?
                            local_exp.map(x => expertCard(x)) :
                            <p className='exp-placeholder'>No Local Expert Found</p>
                        }
                        </div>
                        
                    </Grid.Column>
                    <Grid.Column width={8}>
                        <Divider horizontal>
                            <Header as='h4' color='blue'>
                                <Icon name='user md' />
                                Experts (Nonlocal)
                            </Header>
                        </Divider>
                        <div className='experts'>
                        { global_exp && global_exp.length > 0 ?
                            global_exp.map(x => expertCard(x)) :
                            <p className='exp-placeholder'>No Nonlocal Expert Found</p>
                        }
                        </div>
                    </Grid.Column>
                </Grid>
                <Divider vertical>&</Divider>
                </Segment></Modal.Content>
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

export default ExpertListWindow;