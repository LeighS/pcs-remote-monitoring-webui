// Copyright (c) Microsoft. All rights reserved.

import React, { Component } from 'react';
import * as _ from 'lodash';
import { browserHistory } from "react-router";
import MaintenanceSummary from './maintenanceSummary';
import SystemStatusGrid from '../systemStatusGrid/systemStatusGrid';
import AlarmsByRuleGrid from './alarmsByRuleGrid';
import lang from '../../common/lang';

import './maintenanceWidget.css';

class MaintenanceWidget extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedGrid: 'Notifications',
      timerange: 'PT1H',
      alarmsByRuleGridData: [],
      lastRefreshed: new Date()
    }
    this.selectGrid = this.selectGrid.bind(this);
  }

  setStateFromProps(props) {
    if (!props.alarmsGridData) return;
    if (_.startsWith(props.location.pathname, '/maintenanceBySeverity') && props.params.severity) {
      this.setState({
        alarmsByRuleGridData : props.alarmsGridData.filter((item) => {
          return item.severity === props.params.severity;
        })
      });
    } else {
      this.setState({ alarmsByRuleGridData : props.alarmsGridData });
    }
  }

  componentWillMount() { 
    this.setStateFromProps(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this.setStateFromProps(nextProps);
  }

  onSoftSelectChange({ JobId }) {
    browserHistory.push({ pathname: `/maintenance/job/${JobId}`});
  }

  selectGrid(e) {
    const selectedGrid = e.currentTarget.textContent === 'Notifications' ? 'Notifications' : 'Jobs';
    this.setState({ selectedGrid });
  }

  render() {
    const systemStatusProps = {
      onSoftSelectChange: this.onSoftSelectChange,
      loadingInProgress: this.props.jobsLoadingInProgress,
      jobs: this.props.jobs,
      devices: this.props.devices
    };

    const jobDetailsProps = {
      failed: 0,
      total: 0,
      succeeded: 0,
    };

    (this.props.jobs || []).forEach(({ ResultStatistics }) => {
    	if (ResultStatistics) {
    		const { FailedCount, SucceededCount }  = ResultStatistics;
    		if (FailedCount) ++jobDetailsProps.failed; // Check failed jobs
    		if (FailedCount + SucceededCount) ++jobDetailsProps.total; // Check total jobs
    		if (SucceededCount) ++jobDetailsProps.succeeded; // Check succeeded jobs
    	}
    });

    const totalAlarms = (this.props.alarms || []).filter(alarm => alarm.Status === 'open').length;
    const criticalAlarms = (this.props.alarms || []).filter(alarm => alarm.Status === 'open' && (alarm.Rule || {}).Severity === 'critical').length;
    const warningAlarms = (this.props.alarms || []).filter(alarm => alarm.Status === 'open' && (alarm.Rule || {}).Severity === 'warning').length;
    const maintenanceProps = {
      alarms: {
        total: totalAlarms,
        critical: criticalAlarms,
        warning: warningAlarms
      },

      jobs: jobDetailsProps,
      selectedGrid: this.state.selectedGrid
    };
    const alarmSelected = this.state.selectedGrid === 'Notifications' ? '-active' : '';
    const systemSelected = this.state.selectedGrid === 'Notifications' ? '' : '-active';
    const alarmsByRuleGridProps = {
      devices: this.props.devices,
      timerange: this.state.timerange,
      rowData: this.state.alarmsByRuleGridData
    };
    return (
      <div className="maintenance-container">
        <MaintenanceSummary {...maintenanceProps} />
        <div className="selection-bar">
          <div className={`selection-item${alarmSelected}`} onClick={this.selectGrid}>{lang.NOTIFICATIONS}</div>
          <div className={`selection-item${systemSelected}`} onClick={this.selectGrid}>{lang.JOBS}</div>
        </div>
        <div className={`grid-container${alarmSelected}`}><AlarmsByRuleGrid {...alarmsByRuleGridProps} /></div>
        <div className={`grid-container${systemSelected}`}><SystemStatusGrid {...systemStatusProps}/></div>
      </div>
    );
  }
}

export default MaintenanceWidget;
