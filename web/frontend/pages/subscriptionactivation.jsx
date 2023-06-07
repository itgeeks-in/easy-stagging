import { useNavigate } from 'react-router-dom';
import { useState, useContext, useEffect, useRef } from 'react';
import { useAuthenticatedFetch } from '../hooks';
import { Sidebar, Topbar,Variables } from '../components';
import ItgContext from '../context/activityState.jsx';
import { loaderIcon, editIcon, closeIcon  } from "../assets";
import CodeMirror from "codemirror";
import "codemirror/mode/htmlmixed/htmlmixed";
import "codemirror/lib/codemirror.css";
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/closebrackets";
import "codemirror/addon/fold/xml-fold";

export default function SubscriptionActivation(){
    const windowSize = useRef([window.innerWidth, window.innerHeight]);
    const fetch = useAuthenticatedFetch();
    const navigateTo = useNavigate();
    const [ toggleMenu, setToggleMenu ] = useState(true);
    const [ loadStart , loadStartOption ] = useState(false);
    const [ showApp, showAppOption ] = useState(true);
    const activityContext = useContext(ItgContext);
    const [preview, setPreview] = useState(false);
    const [variableModel, setVariableModel] = useState(false);
    const [testMailModel, setTestMailModel] = useState(false);
    const [editor, setEditor] = useState(false);
    const [previewHtml, setPreviewHtml] = useState('');
    const [testEmail, setTestEmail] = useState("");
    const [emailError, setEmailError] = useState({ status: false, message: "", });
    const [testEmailError, setTestEmailError] = useState({ status: false, message: "", });
    const [nameError, setNameError] = useState({ status: false, message: "", });
    const [subjectError, setSubjectError] = useState({ status: false, message: "", });
    const [messageError, setMessageError] = useState({ status: false, message: "", });
    const [errorAlert, setErrorAlert] = useState({ status: false, message: "", });
    const [successAlert, setSuccessAlert] = useState({ status: false, message: "", });
    const [testErrorAlert, setTestErrorAlert] = useState({ status: false, message: "", });
    const [testSuccessAlert, setTestSuccessAlert] = useState({ status: false, message: "", });
    const [formData, setFormData] = useState({ name: "", email: "", subject: "", catagory: "order", });
    const [message, setMessage] = useState("");
    useEffect(()=>{
        if(activityContext.activity !== ' '){
            if( activityContext.activity === 9 ){
            navigateTo('/noteligible');
            }else if ( activityContext.activity === 0 ){
            navigateTo('/welcome');
            } else if ( activityContext.activity === 1 ){
            navigateTo('/plans');
            } else if(activityContext.activity!=' ') {
                loadStartOption(false);
                subscriptionDataFetch()
                showAppOption(true);
            }
        }else{
            loadStartOption(true);
        }
    },[activityContext]);
    
    useEffect(()=>{
        if( windowSize.current[0] < 776 ){
          setToggleMenu(!toggleMenu);
        }
    }, []);
    
    const toggle = () =>{
        setToggleMenu(!toggleMenu);
    }
    useEffect(() => {
        async function init() {
            let value = CodeMirror.fromTextArea(
                document.getElementById("textArea"),
                {
                    mode: { name: "htmlmixed" },
                    autoCloseTags: true,
                    autoCloseBrackets: true,
                    foldGutter: true,
                    lineNumbers: true,
                }
            );
            if (message != "") {
                value.setValue(message);
            }
            value.on("change", (instance, changes) => {
                messageChange();
                setMessage(instance.getValue());
            });
        }
        if (editor) {
            init();
            setEditor(false);
        }
    }, [editor]);
    function subscriptionDataFetch(){
        loadStartOption(true); 
        fetch( "/api/easy-subscription/settings/notification_mail_settings?catagory=order" )
        .then((res) => {
            if (res.ok) {
                return res.json();
            }
            throw new Error("Something went wrong");
        }).then((data) => {
            console.log(data);
            if (data.status) {
                let name;
                let email;
                let subject;
                if(data.message.from_name != null){
                    name = data.message.from_name;
                }else{
                    name = '';
                }
                if(data.message.from_email != null){
                    email = data.message.from_email;
                }else{
                    email = '';
                }
                if(data.message.subject != null){
                    subject = data.message.subject;
                }else{
                    subject = '';
                }
                setFormData({
                    ...formData,
                    name: name,
                    email: email,
                    subject: subject,
                });
                let code = data.message.mail;
                setMessage(code);
            }
            loadStartOption(false);
        }).catch((error) => {
            loadStartOption(false);
            console.warn(error);
        });
    }
    function validation(error) {
        if (formData.name == "") {
            setNameError({ ...nameError, status: true, message: "Please enter your name", });
            error = true;
        } else {
            setNameError({ ...nameError, status: false, message: "", });
        }
        if (formData.subject == "") {
            setSubjectError({ ...subjectError, status: true, message: "Please enter subject", });
            error = true;
        } else {
            setSubjectError({ ...subjectError, status: false, message: "", });
        }
        if (formData.email == "") {
            setEmailError({ ...emailError, status: true, message: "Please enter your email address", });
            error = true;
        } else {
            if ( !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test( formData.email ) ) {
                setEmailError({ ...emailError, status: true, message: "Please enter a valid email address", });
                error = true;
            } else {
                setEmailError({ ...emailError, status: false, message: "", });
            }
        }
        if (message == "" || message == []) {
            setMessageError({ ...messageError, status: true, message: "Please enter your Email template", });
            error = true;
        } else {
            setMessageError({ ...messageError, status: false, message: "", });
        }
        return error;
    }
    function testEmailValidation(error) {
        if (testEmail == "") {
            setTestEmailError({ ...testEmailError, status: true, message: "Please enter email address", });
            error = true;
        } else {
            if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(testEmail)) {
                setTestEmailError({ ...testEmailError, status: true, message: "Please enter a valid email address", });
                error = true;
            } else {
                setTestEmailError({ ...testEmailError, status: false, message: "", });
            }
        }
        return error;
    }
    function testemailChange(e) {
        let target = e.target;
        let value = target.value;
        setTestEmail(value);
        if (value != "") {
            setTestEmailError({ ...emailError, status: false, message: "", });
        }
    }
    function testMail() {
        if (!(testEmailValidation(false) || validation(false))) {
            let savedata = { testEmail: testEmail, form: formData, code: message, };
            loadStartOption(true);
            fetch("/api/easy-subscription/testmail", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(savedata),
            }).then((res) => {
                if (res.ok) {
                    return res.json();
                }
                throw new Error("Something went wrong");
            }).then((data) => {
                if (data.status) {
                    setTestSuccessAlert({ ...testSuccessAlert, message: "Sent Successfully", status: true, });
                    setTimeout(() => {
                        setTestSuccessAlert({ ...testSuccessAlert, message: "", status: false, });
                    }, 8000);
                } else {
                    setTestErrorAlert({ ...testErrorAlert, message: "please try again", status: true, });
                    setTimeout(() => {
                        setTestErrorAlert({ ...testErrorAlert, message: "", status: false, });
                    }, 8000);
                }
                loadStartOption(false);
            }).catch((error) => {
                setTestErrorAlert({ ...testErrorAlert, message: "please try again", status: true, });
                setTimeout(() => {
                    setTestErrorAlert({ ...testErrorAlert, message: "", status: false, });
                }, 8000);
                loadStartOption(false);
                console.error(error);
            });
        }
    }
    function nameChange(e) {
        let target = e.target;
        let value = target.value;
        if (value != "") {
            setNameError({ ...nameError, status: false, message: "", });
        }
        setFormData({ ...formData, name: value, });
    }
    function emailChange(e) {
        let target = e.target;
        let value = target.value;
        setFormData({ ...formData, email: value, });
        if (value != "") {
            setEmailError({ ...emailError, status: false, message: "", });
        }
    }
    function testemailChange(e) {
        let target = e.target;
        let value = target.value;
        setTestEmail(value);

        if (value != "") {
            setTestEmailError({ ...emailError, status: false, message: "", });
        }
    }
    function messageChange() {
        if (message != "") {
            setMessageError({ ...messageError, status: false, message: "", });
        }
    }
    function save() {
        let error = validation(false);
        if (!error) {
            let savedata = {
                form: formData,
                code:message,
            };
            loadStartOption(true);
            fetch( "/api/easy-subscription/settings/subscription_mail_activation/update",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json", },
                    body: JSON.stringify(savedata),
                }
            )
            .then((res) => {
                if (res.ok) {
                    return res.json();
                }
                throw new Error("Something went wrong");
            })
            .then((data) => {
                if (data.status) {
                    setSuccessAlert({ ...successAlert, message: "Saved Successfully", status: true, });
                    setTimeout(() => {
                        setSuccessAlert({ ...successAlert, message: "", status: false, });
                    }, 8000);
                } else {
                    setErrorAlert({ ...errorAlert, message: "something went wrong please try again", status: true, });
                    setTimeout(() => {
                        setErrorAlert({ ...errorAlert, message: "", status: false, });
                    }, 8000);
                    loadStartOption(false);
                }
                console.log(data);
                loadStartOption(false);
            })
            .catch((error) => {
                setErrorAlert({ ...errorAlert, message: "something went wrong please try again", status: true, });
                setTimeout(() => {
                    setErrorAlert({ ...errorAlert, message: "", status: false, });
                }, 8000);
                loadStartOption(false);
                console.error(error);
            });
        }
    }
    function openModel() {
        let errors = validation(false);
        if (!errors) {
            setTestMailModel(true);
        }
    }
    function previewMail(){
        let savedata = {
            topic: formData.catagory,
            code:message,
        };
        loadStartOption(true);
        fetch( "/api/easy-subscription/previewmail",
            {
                method: "POST",
                headers: { "Content-Type": "application/json", },
                body: JSON.stringify(savedata),
            }
        )
        .then((res) => {
            if (res.ok) {
                return res.json();
            }
            throw new Error("Something went wrong");
        })
        .then((data) => {
            if (data.status) {
                console.log(data.html);
                setPreview(true);
                setPreviewHtml(data.html);
            } else {
                loadStartOption(false);
            }
            console.log(data);
            loadStartOption(false);
        })
        .catch((error) => {
            setErrorAlert({ ...errorAlert, message: "something went wrong please try again", status: true, });
            setTimeout(() => {
                setErrorAlert({ ...errorAlert, message: "", status: false, });
            }, 8000);
            loadStartOption(false);
            console.error(error);
        });
    }
    return(
        <>
            {showApp?<>
                {loadStart?<>
                <div className="itg-main-loader active">
                    <img src={loaderIcon} alt=""/>
                </div>
                </>:<></>}
                <div className="itgDashboardPage">
                    <Sidebar toggle={toggle} togglemenu={toggleMenu}/>
                    <div className={toggleMenu?"itgDashboardPageContent":"itgDashboardPageContent full"}>
                        <Topbar toggle={toggle}/>
                        <Variables variableModel={variableModel} variableModelFunction={()=>{setVariableModel(!variableModel)}}/>
                        <div className={ testMailModel ? "itgModel itgModelShow" : "itgModel itgModelHide" } >
                            <div className="itgModelWrapper">
                                <div className="itgModelIn itgTestEmailModel">
                                    <h6 className="itgModelHeading">Send Test Mail</h6>
                                    <div className="itgModelInInput">
                                        <input className={ testEmailError.status ? "itginputerror" : ""} type="text" value={testEmail} onChange={testemailChange} placeholder="Enter email" name="email" />
                                        {testEmailError.status ? <p className="itgErrorAlert"> {testEmailError.message} </p> : "" }
                                        <div className="subActiveModelButtons">
                                            <button onClick={testMail} className="btn"> Send </button>
                                            <button onClick={() => { setTestMailModel(false); }} > Close </button>
                                        </div>
                                        <div style={ testErrorAlert.status || testSuccessAlert.status ? { display: "flex" } : { display: "none" } } className="alertMessage" >
                                            {testErrorAlert.status ? <p className="itgErrorAlert"> {testErrorAlert.message} </p> : "" }
                                            {testSuccessAlert.status ? <p className="itgSuccessAlert"> {testSuccessAlert.message} </p> : "" }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className={ preview ? "itgModel itgModelShow" : "itgModel itgModelHide" } >
                            <div className="itgModelWrapper preview">
                                <div className="itgModelHead">
                                    <h6 className="itgEmailPreviewText">Preview</h6>
                                    <div onClick={() => { setPreview(false); }} className="itgEmailPreviewImg" >
                                        <img src={closeIcon} alt="" />
                                    </div>
                                </div>
                                <div className="itgModelIn">
                                <div className="itgModelCont" ><iframe srcDoc={previewHtml} frameBorder="0"></iframe></div>
                                </div>
                            </div>
                        </div>
                        <div className="subActive">
                            <div className="subActiveHeadbtns">
                                <div className="subActiveHead">
                                    <h5 className="innerHead">Subscription order Confirmation</h5>
                                    <p className="paragraph"> Sent to customers when subscription order is confirmed. </p>
                                </div>
                                <button onClick={()=>{setVariableModel(!variableModel)}}>Variable Doc</button>
                            </div>
                            <div className="subActiveIn">
                                <h5 className="subActiveInHead">Email content</h5>
                                <div className="subActiveFormDiv">
                                    <form id="subActiveForm" onSubmit={(e) => { e.preventDefault(); }} >
                                        <div className="subActiveFormInput">
                                            
                                            <label htmlFor="">
                                                From name
                                                <input className={ nameError.status ? "itginputerror" : "" } type="text" value={formData.name} onChange={nameChange} placeholder="Store Name" name="name" />
                                                {nameError.status ? <p className="itgErrorAlert"> {nameError.message} </p> :""}
                                            </label>
                                           {/*
                                            <label htmlFor="">
                                                From email
                                                <input className={ emailError.status ? "itginputerror" : "" } type="text" value={formData.email} onChange={emailChange} placeholder="Store Email" name="email" />
                                                {emailError.status ? <p className="itgErrorAlert"> {emailError.message} </p> :""}
                                            </label>
                                             */}
                                            <label htmlFor="">
                                                Email subject
                                                <input className={ subjectError.status ? "itginputerror" : "" } type="text" value={formData.subject} onChange={(e) => { setFormData({ ...formData, subject: e.target.value, }); }} placeholder="Order Confirmation" name="email" />
                                                {subjectError.status ? <p className="itgErrorAlert"> {subjectError.message} </p> : ""}
                                            </label>
                                        </div>
                                        <div className="subActiveMessage">
                                            <label htmlFor="">Email template</label>
                                            <textarea onClick={() => setEditor(true)} placeholder={message} id="textArea" ></textarea>
                                            {messageError.status ? <p className="itgErrorAlert"> {messageError.message} </p> : ""}
                                            <div className="subActiveButtons">
                                                <button onClick={save} > Save </button>
                                                <button onClick={openModel} className="btn"> Send a test email </button>
                                                <button onClick={previewMail}> Preview </button>
                                            </div>
                                            <div className="alertMessage">
                                                {errorAlert.status ? <p className="itgErrorAlert"> {errorAlert.message} </p> :""}
                                                {successAlert.status ? <p className="itgSuccessAlert"> {successAlert.message} </p> :""}
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>       
            </>:<>
                <div className="itg-main-loader active"> <img src={loaderIcon} alt=""/> </div>
            </>}
        </>
    )
}