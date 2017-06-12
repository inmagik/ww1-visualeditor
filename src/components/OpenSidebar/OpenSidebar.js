import React, { PureComponent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from 'reactstrap'
import './OpenSidebar.css'

class OpenSidebar extends PureComponent {

  state = {
    open:false
  }

  toggleMenu = () => {
    this.setState({
      open: !this.state.open
    })
  }

  render () {
    const { setLang } = this.props
    return (
     <div className="OpenSidebar">
       <ul className="OpenSidebar__toplist">
         <li><Link to="/" onClick={this.props.closeMenu}><Button className="OpenSidebar__btn" outline color="primary">Home</Button></Link></li>
         <li><Link to="/themes" onClick={this.props.closeMenu}><Button className="OpenSidebar__btn" outline color="primary">Themes</Button></Link></li>
         <li><Link to="/" onClick={this.props.closeMenu}><Button className="OpenSidebar__btn" outline color="primary">Static Pages</Button></Link></li>
         <li><Link to="/" onClick={this.props.closeMenu}><Button className="OpenSidebar__btn" outline color="primary">Education</Button></Link></li>
       </ul>
       <ul className="OpenSidebar__bottomlist">
         <li><Link to="/" onClick={this.props.closeMenu}><Button className="OpenSidebar__btn" outline color="primary">Help</Button></Link></li>
         <li><Link to="/" onClick={this.props.closeMenu}><Button className="OpenSidebar__btn" outline color="primary">Report a bug</Button></Link></li>
         <li><Link to="/" onClick={this.props.closeMenu}><Button className="OpenSidebar__btn" outline color="primary">Logout</Button></Link></li>
       </ul>
       <div className="OpenSidebar__Language__container">
         <h6>Language</h6>
         <div className="OpenSidebar__LanguageBtn_container">
           <Button onClick={() => setLang('EN')} className="OpenSidebar__LanguageBtn">EN</Button>
           <Button onClick={() => setLang('FR')} className="OpenSidebar__LanguageBtn">FR</Button>
           <Button onClick={() => setLang('DE')} className="OpenSidebar__LanguageBtn">DE</Button>
         </div>
       </div>
     </div>
    )
  }
}

export default OpenSidebar
