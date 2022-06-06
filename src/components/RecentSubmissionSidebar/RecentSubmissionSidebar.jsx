import React from 'react';
import { connect } from 'react-redux';
import { Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import contestAPI from 'api/contest';

import { ErrorBox, SpinLoader } from 'components';
import ContestContext from 'context/ContestContext';

import { getHourMinuteSecond, getYearMonthDate } from 'helpers/dateFormatter';

import './RecentSubmissionSidebar.scss';

class RSubItem extends React.Component {
  parseTime(time) {
    if (time === 0) return "0 ms";
    if (!time) return "N/A";
    return `${(time*1000).toFixed(0)} ms`
  }
  parseMemory(mem) {
    if (mem === 0) return "0 KB";
    if (!mem) return "N/A";
    if (mem > 65535)
      return `${(mem+1023)/1024} MB`
    return `${mem} KB`
  }

  render() {
    const {id, problem, user, status, result, time, memory, date} = this.props;
    const verdict = (status === "D" ? result : status);

    return (
      <tr>
        <td className="text-truncate" style={{width: "5%"}}>
          <Link to={`submission/${id}`}>{id}</Link>
        </td>
        <td className="text-truncate" style={{width: "10%"}}>
          <Link to={`problem/${problem.shortname}`}>{problem.shortname}</Link>
        </td>

        {
          <td className={`verdict ${verdict.toLowerCase()}`} style={{width: "6%"}}>
            <span>{verdict}</span>
          </td>
        }

        <td className="flex-center responsive-date" style={{fontWeight: 100}}>
          <div className="d-none d-lg-block">{`${getYearMonthDate(date)}, ${getHourMinuteSecond(date)}`}</div>
          <div className="d-block d-lg-none">
            <div style={{fontSize: "8px"}}>{getYearMonthDate(date)}</div>
            <div style={{fontSize: "10px"}}>{getHourMinuteSecond(date)}</div>
          </div>
        </td>
      </tr>
    )
  }
}

class RecentSubmissionSidebar extends React.Component {
  static contextType = ContestContext;
  constructor(props) {
    super(props);
    this.state = {
      subs: [],
      loaded: false,
      errors: null,
      count: null,

      contest: null,
      user: null,
    }
  }

  refetch() {
    this.setState({ loaded: false, count: null, errors: null })
    const { user } = this.state;
    contestAPI.getContestSubmissions({ key: this.state.contest.key,
                                        params: {user: user.username} })
      .then((res) => {
        this.setState({
          loaded: true,
          subs: res.data.results, // first page only
          count: res.data.count,
        })
        // console.log(res);
      })
      .catch((err) => {
        this.setState({
          loaded: true,
          errors: err,
        })
      })
  }

  componentDidMount() {
    // Fix when component unmount and remount again,
    // lifecycle DidUpdate never get invoked because the props doesn't change.
    this.setState({
      contest: (this.context && this.context.contest) || null,
      user: (this.props && this.props.user) || null,
    })
  }

  componentDidUpdate(prevProps, prevState) {
    const { user } = this.props;
    const { contest } = this.context;
    if (!user || !contest) return; // skip if no user or no contest
    if (prevState.contest !== contest || prevState.user !== user) {
      this.setState({ user, contest }, () => this.refetch());
    }
  }

  render() {
    const { subs, loaded, user, contest } = this.state;

    return (
      <div className="flex-center wrapper-vanilla" id="recent-submission-sidebar">
        <h4>Recent Submission</h4>
        { !user && <span><Link to='/sign-in'>Log in</Link> to see</span> }
        { !!user && !contest && <span>Contest is not available.</span> }
        { !!user && !!contest && !loaded && <SpinLoader margin="20px"/>}
        { !!user && !!contest && !!loaded && <>
          <ErrorBox errors={this.state.errors} />
          <Table responsive hover size="sm" striped bordered className="rounded">
            <thead>
              <tr>
                <th style={{width: "5%"}}>#</th>
                <th className="text-truncate" style={{width: "10%"}}>Problem</th>
                <th className="text-truncate" style={{width: "6%"}}>Status</th>
                {/* <th className="text-truncate">Time</th>
                <th className="text-truncate">Memory</th> */}
                <th className="text-truncate">Date</th>
              </tr>
            </thead>
            <tbody>
              { this.state.count === 0 && <>
                <tr><td colSpan="4">
                  <em>No Submissions Yet.</em>
                </td></tr>
              </> }
              { this.state.count > 0 &&
                subs.map((sub, idx) => <RSubItem
                  key={`recent-sub-${sub.id}`} rowid={idx} {...sub} />) }
            </tbody>
          </Table>
        </>}
      </div>
    )
  }
}

let wrapped = RecentSubmissionSidebar;
const mapStateToProps = state => {
  return {
    user: state.user.user,
    profile: state.profile.profile,
  }
}
export default connect(mapStateToProps, null)(wrapped);
