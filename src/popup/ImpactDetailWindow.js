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
import { Button, Modal, Table, Segment, Grid, Divider, Header, Icon } from 'semantic-ui-react'
import NOAADisaster from '../datasets/NOAADisaster'
import Utils from '../util/utils'

function reducer(state, action) {
    switch (action.type) {
        case 'OPEN_MODAL':
            return { open: true, dimmer: action.dimmer }
        case 'CLOSE_MODAL':
            return { open: false }
        case 'SHOW_EXPERTS':
            return { searched: true }
        case 'HIDE_EXPERTS':
            return { searched: false }
        default:
            throw new Error()
    }
}

function ImpactDetailWindow(props) {
    const [state, dispatch] = React.useReducer(reducer, {
        open: false,
        dimmer: undefined,
        searched: false,
    })
    const { open, dimmer } = state

    React.useEffect(() => {
        const show = props.data !== null;
        if(show === open)
            return;

        if (show) {
            dispatch({ type: 'OPEN_MODAL', dimmer: 'blurring' });
        } else {
            dispatch({ type: 'CLOSE_MODAL' });
        }
    });

    const onClose = () => props.sendMessage('setImpactDetail', null);
    // const onFind = () => dispatch({ type: 'SHOW_EXPERTS' });

    // const expert_keys = [
    //     'Research Interests',
    //     'Study Area',
    // ];

    // const local_exp = props.experts.slice();
    // const global_exp= local_exp.splice(20, 1);

    // const expert_panes =  [
    //     {
    //       menuItem: 'Local',
    //       render: () => <Tab.Pane attached={false}>{local_exp.map(expertCard)}</Tab.Pane>,
    //     },
    //     {
    //       menuItem: 'Global',
    //       render: () => <Tab.Pane attached={false}>{global_exp.map(expertCard)}</Tab.Pane>,
    //     },
    // ]

    // const expertCard = expert => (
    //     <div className='rec-card'>
    //         <div className='expert-head'>{expert.Name.split(',')[0]}
    //             <span>{expert.Name.split(',')[1]}</span>
    //             {expert.Affiliation.split(',').map(d =>
    //                 <p>{d.trim()}</p>
    //             )}
    //             <p>{expert['Location (Affiliation)']}</p>
    //         </div>
    //         {expert_keys.map(d => 
    //             <div className='stat-item'>
    //                 <div>{d}</div>
    //                 <div>
    //                 {expert[d].split(';').map(tag => tag.trim() &&
    //                     <Label>{tag.trim()}</Label>
    //                 )}
    //                 </div>
    //             </div> 
    //         )}
    //         <div className='stat-item'>
    //             <div>Profile</div>
    //             <a href={expert.Profile} target='_blank' rel='noreferrer'>
    //                 Go to Expert's Profile Webpage
    //             </a>
    //         </div> 
    //     </div>
    // );

    const stat_table = (record, stat, basic, className) => (
        <Table definition basic={basic} className={className}>
            <Table.Body>
                {stat.map(d => record[d.key] &&
                <Table.Row>
                    <Table.Cell>{d.name}</Table.Cell>
                    <Table.Cell textAlign='right'>
                        {Utils.formatNumber(Utils.formatDecimal(record[d.key].value * (d.scalar || 1), 2), true)} 
                        {' ' + d.unit}
                    </Table.Cell>
                </Table.Row>
                )}
            </Table.Body>
        </Table>
    );

    return (
        <div>
            <Modal dimmer={dimmer} open={open} onClose={onClose}>
                <Modal.Header>{props.data && props.data.name} County</Modal.Header>
            {
                props.data &&
                <Modal.Content><Segment vertical>
                <Grid className='popup-view impact-view' columns={2} relaxed='very'>
                    <Grid.Column width={8}>
                        <Divider horizontal>
                            <Header as='h4' color='red'>
                                <Icon name='info circle' />
                                Impact Reports
                            </Header>
                        </Divider>
                        <div className='impact-seg impact'>
                        {props.data.rec.map(x =>
                            NOAADisaster.STAT_KEYS
                                .map(d => x[d.key] ? parseFloat(x[d.key].value) : 0)
                                .reduce((a, b) => a + b) > 0 && (
                            <div className='rec-card'>
                                <div className='impact-head'>{x.event_type_short.value}
                                    <p>{x.event_timeLabel.value}</p>
                                </div>
                                { stat_table(x, NOAADisaster.STAT_KEYS, 'very') }
                            </div>
                        ))}
                        </div>
                    </Grid.Column>
                    <Grid.Column width={8}>
                        <Divider horizontal>
                            <Header as='h4' color='teal'>
                                <Icon name='heart' />
                                Health Factors
                            </Header>
                        </Divider>
                        { stat_table(props.data.rec[0], NOAADisaster.HEALTH_KEYS, null, 'health-table') }
                    </Grid.Column>
                    {/* { searched ? <Grid.Column width={9}>
                        <Divider horizontal>
                            <Header as='h4' color='blue'>
                                <Icon name='user md' />
                                Recommended Experts
                            </Header>
                        </Divider>
                        <div className='impact-seg experts'>
                            <Tab menu={{ secondary: true, pointing: true }} panes={expert_panes} />
                        </div>
                    </Grid.Column> : <Grid.Column width={9}>
                        <Button className='ui button blue find-button' onClick={onFind}>Find Related Experts</Button>
                    </Grid.Column>} */}
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

export default ImpactDetailWindow;