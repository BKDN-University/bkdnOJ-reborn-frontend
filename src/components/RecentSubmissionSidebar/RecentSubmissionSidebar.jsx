import React from 'react';

// Redux
import { connect } from 'react-redux';
import { stopPolling } from 'redux/RecentSubmission/actions';

import { Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import contestAPI from 'api/contest';

import { ErrorBox, SpinLoader } from 'components';
import ContestContext from 'context/ContestContext';

// Helpers
import { getHourMinuteSecond, getYearMonthDate } from 'helpers/dateFormatter';
import { shouldStopPolling } from 'constants/statusFilter';

import './RecentSubmissionSidebar.scss';

const __RECENT_SUBMISSION_POLL_DELAY = 3000; // ms
const __RECENT_SUBMISSION_MAX_POLL_DURATION = 30 * 1000; // ms

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
    const {id, ckey, problem, language, points, user, status, result, time, memory, date} = this.props;
    const verdict = (status === "D" ? result : status);

    const max_points = problem.points;

    return (
      <tr>
        <td className="info">
          <div className="info-wrapper">

            <div className="sub-wrapper">
              <Link id="sub-id" to={`/contest/${ckey}/submission/${id}`}>#{id}</Link>
            </div>

            <div className="flex-center-col prob-wrapper">
              <span className="prob">
                <Link to={`/contest/${ckey}/problem/${problem.shortname}`}>{problem.shortname}</Link>
              </span>
              <span className="lang">{language}</span>
            </div>
          </div>
        </td>

        <td className={`result verdict ${verdict.toLowerCase()}`} >
          <div className="result-wrapper">
            <span className={`text verdict ${verdict.toLowerCase()}`}>
              {verdict}
            </span>
            <div className={`flex-center-col`}>
              {typeof(points) === 'number'
                ? <><span className={`points verdict ${verdict.toLowerCase()} text-truncate`}>{points}</span>
                  <span className="points">pts</span></>
                : "n/a"}
            </div>
          </div>
        </td>

        <td className="flex-center responsive-date">
          <div className="date">{getYearMonthDate(date)}</div>
          <div className="time">{getHourMinuteSecond(date)}</div>
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

      isPollingOn: true,
      isPolling: false,
    }
  }

  refetch(poll=false) {
    if(poll)
      this.setState({ isPolling: true, errors: null })
    else
      this.setState({ loaded: false, count: null, errors: null })

    const { user } = this.state;
    contestAPI.getContestSubmissions({ key: this.state.contest.key,
                                        params: {user: user.username} })
      .then((res) => {
        this.setState({
          isPolling: false,
          loaded: true,
          subs: res.data.results, // first page only
          count: res.data.count,
        })
        // console.log(res);
      })
      .catch((err) => {
        this.setState({
          isPolling: false,
          loaded: true,
          errors: err,
        })
      })
  }

  pollResult() {
    if (shouldStopPolling(this.state.subs[0].status) || !!this.state.errors) {
      clearInterval(this.timer)
      return;
    }
    this.refetch(true);
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

    // Refetch if: state.contest was updated, state.user was updated
    if (prevState.contest !== contest || prevState.user !== user) {
      this.setState({ user, contest }, () => {
        this.refetch()
      });
    }

    // Polling status changes
    if (prevProps.polling !== this.props.polling) {
      clearInterval(this.timer);
      if (this.props.polling) {
        this.refetch(true)
        this.timer = setInterval(()=>this.pollResult(), __RECENT_SUBMISSION_POLL_DELAY);
        setTimeout(() => this.props.stopPolling(), __RECENT_SUBMISSION_MAX_POLL_DURATION);
      }
    }

  }
  componentWillUnmount(){
    clearInterval(this.timer)
  }

  render() {
    const { subs, loaded, errors, user, contest, isPolling } = this.state;
    if (errors)
      return <></>

    return (
      <div className="wrapper-vanilla" id="recent-submission-sidebar">
        <h4>Recent Submission</h4>
        { !user && <span><Link to='/sign-in'>Log in</Link> to see</span> }
        { !!user && !contest && <span>Contest is not available.</span> }
        { !!user && !!contest && !loaded && <SpinLoader margin="20px"/>}
        { !!user && !!contest && !!loaded && <>
          <ErrorBox errors={errors} />
          <Table responsive hover size="sm" striped bordered className="rounded">
            <thead>
              <tr>
                {/* <th className="subid">#</th>
                <th className="text-truncate prob">Problem</th>
                <th className="text-truncate verdict">Result</th>
                <th className="text-truncate responsive-date">Date</th> */}
                <th className="subid">Info</th>
                <th className="text-truncate result">Result</th>
                <th className="text-truncate responsive-date">When</th>
              </tr>
            </thead>
            <tbody>
              {
                loaded && !errors && <>
                { this.state.count === 0 && <>
                  <tr><td colSpan="4">
                    <em>No Submissions Yet.</em>
                  </td></tr>
                </> }
                { this.state.count > 0 &&
                  subs.map((sub, idx) => <RSubItem
                    key={`recent-sub-${sub.id}`} rowid={idx} ckey={this.state.contest && this.state.contest.key} {...sub} />) }
                </>
              }
            </tbody>
          </Table>
          { !!user && !!contest && !!loaded && this.state.count > subs.length &&
            <span style={{fontSize: "12px"}}><em>..and {this.state.count - subs.length} more.</em></span>
          }
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
    polling: state.recentSubmission.polling,
  }
}
const mapDispatchToProps = dispatch => {
  return {
    stopPolling: () => dispatch(stopPolling()),
  }
}
export default connect(mapStateToProps, mapDispatchToProps)(wrapped);
