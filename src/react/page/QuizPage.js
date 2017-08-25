import React, { Component } from "react";
import Request from "../../Requests";
import { Row, Col, Button, Table, tr, th, thead, tbody, Dropdown, NavItem } from 'react-materialize';
import QuizDisplayTable from "../components/QuizDisplayTable";
import Helper from "../../Helper";
import { Link } from 'react-router-dom';

export default class HomePage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            quizDataReceived: null
        }

        this.deleteQuizClicked = this.deleteQuizClicked.bind(this);
    }

    componentDidMount() {
        Request.getAllQuizQuestion()
            .then((data) => {
                let sortedData = Helper.getSelectedContent(data);
                this.setState({
                    quizDataReceived: sortedData
                })
            })
    }

    deleteQuizClicked(e) {
        Request.deleteVideo(e._id)
            .then((data) => {
                this.componentDidMount();
            })
    }

    render() {
        return (
            <div>
                <div className="fixedPosition">
                    <Link to='/newquiz'>
                        <Button floating large className='backgroundColor iconStyle' waves='light' icon='add' />
                    </Link>
                </div>
                <Row>
                    <Col s={5}>
                        <h5>Quizes</h5>
                    </Col>
                </Row>
                <Row>
                    <Col s={10}>
                        <QuizDisplayTable data={this.state.quizDataReceived} deleteCallback={this.deleteQuizClicked} />
                    </Col>
                </Row>
            </div>
        )
    }
}