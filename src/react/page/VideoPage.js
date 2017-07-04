import React, { Component } from "react";
import Request from "../../Requests";
import { Row, Col, Button, Table, tr, th, thead, tbody, Dropdown, NavItem } from 'react-materialize';
import VideoDisplayTable from "../components/VideoDisplayTable";
import Helper from "../../Helper";

export default class VideoPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            videoDataReceived: null
        }
    }

    componentDidMount() {
        Request.getAllVideo()
            .then((data) => {
                let sortedData = Helper.getSelectedContent(data);
                this.setState({
                    videoDataReceived: sortedData
                })
            })
    }

    deleteVideoClicked(e) {
        let url = config.restAPI + "/api/video/" + e._id;
        fetch(url, { method: 'DELETE' })
            .then(res => res.json())
            .then((data) => {
                this.componentDidMount();
            })
    }

    render() {
        return (
            <div>
                <Row>
                    <Col s={5}>
                        <h5>Video</h5>
                    </Col>
                </Row>
                <Row>
                    <Col s={10}>
                        <VideoDisplayTable data={this.state.videoDataReceived} deleteCallback={this.deleteVideoClicked} />
                    </Col>
                </Row>
            </div>
        )
    }
}