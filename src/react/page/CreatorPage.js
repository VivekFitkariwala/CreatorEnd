import React, { Component } from "react";
import brace from 'brace';
import AceEditor from 'react-ace';
import { Input, Row, Col, Button, Navbar, NavItem } from 'react-materialize';
import config from '../../config';
import ImageUploaded from '../components/ImageUploaded';
import InnerHtml from '../components/InnerHtml';
import { Encoder } from 'node-html-encoder';

import 'brace/mode/html';
import 'brace/theme/github';

export default class HomePage extends Component {
    firstName;
    profilePicture;
    facebookID;
    accessToken;
    facebookData;

    constructor(props) {
        super(props);
        this.state = {
            imageUploaded: [],
            htmlWritten: "",
            questionTitle: "",
            introImage: "",
            outputText: "",

            loggedIn: false,
            dataRetrieved: false
        }
        this.onEditorChange = this.onEditorChange.bind(this);
        this.onFileUploaded = this.onFileUploaded.bind(this);
        this.uploadFile = this.uploadFile.bind(this);
        this.addQuestionInDataBase = this.addQuestionInDataBase.bind(this);
        this.onTextChange = this.onTextChange.bind(this);
        this.onLoginClicked = this.onLoginClicked.bind(this);
    }

    componentDidMount() {
        let template = require("../../templates/quiz").template;
        this.setState({
            htmlWritten: template
        })
        FB.init({
            appId: config.appID,
            xfbml: true,
            version: 'v2.9',
            status: true
        });
        FB.getLoginStatus((response) => {
            if (response.status === 'connected') {
                this.updateLoginDetails(response);
            } else if (response.status === 'not_authorized') {
                console.log("User is not authorised");
            } else {
                console.log("Unknown status");
            }
        });
    }

    onTextChange(e) {
        let value = e.currentTarget.value;
        let name = e.currentTarget.name;
        let tempObject = {};
        tempObject[name] = value;
        this.setState(tempObject);
    }

    onEditorChange(e) {
        this.setState({
            htmlWritten: e
        })
    }

    onFileUploaded(e) {
        let target = e.currentTarget.files[0];
        let fileName = e.currentTarget.files[0].name;
        let url = config.restAPI + "/api/aws?file-name=" + fileName + "&file-type=" + target.type;
        fetch(url, { method: 'GET' })
            .then(res => res.json())
            .then((data) => {
                this.uploadFile(target, data.signedRequest, data.url)
            })
    }

    onLoginClicked(e) {
        FB.login((response) => {
            if (response.status === 'connected') {
                this.updateLoginDetails(response);
            } else if (response.status === 'not_authorized') {
                // the user is logged in to Facebook, 
                // but has not authenticated your app
            } else {
                // the user isn't logged in to Facebook.
            }
        }, { scope: config.scope });
    }

    updateLoginDetails(response) {
        var uid = response.authResponse.userID;
        var accessToken = response.authResponse.accessToken;
        FB.api('me?fields=first_name,picture', (response) => {
            this.firstName = response.first_name;
            this.profilePicture = response.picture.data.url;
            this.facebookID = uid;
            this.accessToken = accessToken;
            this.setState({
                loggedIn: true
            })

            let postData = {};
            postData.id = uid;
            postData.accessToken = accessToken;
            let url = `${config.restAPI}/api/facebook`;
            fetch(url, {
                method: "POST",
                body: JSON.stringify(postData),
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
            })
                .then(res => res.json())
                .then((data) => {
                    this.facebookData = new ParseData.default(data, Date.now());
                    this.setState({
                        dataRetrieved: true
                    })
                })
        });
    }

    uploadFile(file, signedURL, url) {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', signedURL, true);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    console.log("Image Uploaded", url);
                    let newArray = JSON.parse(JSON.stringify(this.state.imageUploaded));
                    newArray.push(url);
                    this.setState({
                        imageUploaded: newArray
                    })

                }
                else {
                    alert('Could not upload file.');
                }
            }
        };
        xhr.send(file);
    }

    addQuestionInDataBase(e) {
        //make post request for adding question
        let questionTitle = this.state.questionTitle;
        let introImage = this.state.introImage;
        let outputText = this.state.outputText;
        let questionHTML = this.state.htmlWritten;

        let data = {};
        data["questionTitle"] = questionTitle;
        data["introImage"] = introImage;
        data["outputText"] = outputText;
        data["questionHTML"] = questionHTML;

        let url = config.restAPI + "/api/game";
        fetch(url, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        })
            .then(res => res.json())
            .then((data) => {
                console.log(data);
            })
    }

    render() {
        let imgUploadComp = <div></div>
        if (this.state.imageUploaded.length > 0) {
            imgUploadComp = <ImageUploaded gameLink={this.state.imageUploaded} />;
        }

        // sending data to iframe
        let iframeData = JSON.stringify(this.facebookData);


        // sending encoded html
        let encoder = new Encoder('entity');
        let parsedData = this.state.htmlWritten;
        if(this.state.dataRetrieved){
            parsedData = this.facebookData.analizeDomElement(parsedData);
            console.log(parsedData);
        }
        let encodedHTML = encoder.htmlEncode(parsedData);
        encodedHTML = "data:text/html;charset=utf-8," + encodedHTML;

        let iframeHTML = "<iframe name='" + iframeData + "' src='" + encodedHTML + "' style='width:100%; height:367px'/>";
        let loginTag = <NavItem onClick={this.onLoginClicked}>login</NavItem>;
        if (this.state.loggedIn) {
            loginTag = <NavItem>
                <img className="imageSize circle" src={this.profilePicture} />
                <span className="basePadding">{this.firstName}</span>
            </NavItem>
        }

        return (
            <div>
                <Row>
                    <Navbar className="backgroundColor" brand='logo' right>
                        {loginTag}
                    </Navbar>
                </Row>
                <Row>
                    <Col s={6}>
                        <Row>
                            <Input name="questionTitle" label="Question Title" s={12} onChange={this.onTextChange} />
                        </Row>
                        <Row>
                            <Input name="introImage" label="Intro Image" s={12} onChange={this.onTextChange} />
                        </Row>
                        <Row>
                            <Input name="outputText" label="Output Text" s={12} onChange={this.onTextChange} />
                        </Row>
                    </Col>
                    <Col s={5} offset="s1">
                        <div className="file-field input-field">
                            <div className="btn">
                                <span>FILE</span>
                                <input type="file" onChange={this.onFileUploaded} />
                            </div>
                            <div className="file-path-wrapper">
                                <input className="file-path validate" type="text" placeholder="Upload file" />
                            </div>
                        </div>
                        {imgUploadComp}
                    </Col>
                </Row>
                <Row>
                    <Col s={5}>
                        <AceEditor
                            value={this.state.htmlWritten}
                            enableBasicAutocompletion={true}
                            enableLiveAutocompletion={true}
                            mode="html"
                            theme="github"
                            onChange={this.onEditorChange}
                            name="UNIQUE_ID_OF_DIV"
                            editorProps={{ $blockScrolling: true }}
                            width="100%"
                        />
                    </Col>
                    <Col s={7}>
                        <Row>
                            <Col s={12}>
                                <div className="iframeSize" dangerouslySetInnerHTML={{ __html: iframeHTML }}></div>
                            </Col>
                            <Col s={2}>
                                <Button waves='light' onClick={this.addQuestionInDataBase}>submit</Button>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </div>
        )
    }
}