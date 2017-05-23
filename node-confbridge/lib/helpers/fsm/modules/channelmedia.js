'use-strict';

var Q = require('q');
var util = require('util');

var LISTEN_VOLUME = 'VOLUME(TX)';
var TALK_VOLUME = 'VOLUME(RX)';
var PITCH_SHIFT = 'PITCH_SHIFT(RX)';
var USER_TO_BRIDGE = 'in';

/**
 * A module for finite state machines that handles media operations for users.
 */
function ChannelMediaModule() {

  var self = this;

  var currentPlayback = null;
  var listenCounter = 1;
  var talkCounter = 1;
  var pitchChanger = 0;
  var muted = false;
  var deafMuted = false;

  /**
   * Mutes and unmutes the channel.
   *
   * @param {Object} ari - the ARI client
   * @param {Object} bridge - the bridge the channel is in
   * @param {Object} channel - the channel to mute / unmute
   */
  this.muteChannel = function(ari, bridge, channel) {
    if (currentPlayback) {
      var stopPlayback = Q.denodeify(currentPlayback.stop.bind(
                                     currentPlayback));
      stopPlayback()
        .catch(function (err) {
          return;
        })
        .done();
    }
    currentPlayback = ari.Playback();
    if (!muted) {
      var soundToPlay = util.format('sound:%s',
                                    bridge.settings.now_muted_sound);
      var mute = Q.denodeify(channel.mute.bind(channel));
      mute({direction: USER_TO_BRIDGE})
        .then(function () {
          muted = true;
          var play = Q.denodeify(channel.play.bind(channel));
          return play({media: soundToPlay}, currentPlayback);
        })
        .catch(function (err) {
          console.error(err);
        })
        .done();
    }
    else {
      var soundToPlay = util.format('sound:%s',
                                    bridge.settings.now_unmuted_sound);
      var unmute = Q.denodeify(channel.unmute.bind(channel));
      unmute({direction: USER_TO_BRIDGE})
        .then(function () {
          muted = false;
          var play = Q.denodeify(channel.play.bind(channel));
          return play({media: soundToPlay}, currentPlayback);
        })
        .catch(function (err) {
          console.error(err);
        })
        .done();
    }
  };

  /**
   * Deaf mutes and undeaf mutes the channel.
   *
   * @param {Object} channel - the channel to deaf mute / undeaf mute
   */
  this.deafMuteChannel = function(channel) {
    if (!deafMuted) {
      var mute = Q.denodeify(channel.mute.bind(channel));
      mute({direction: 'both'})
        .then(function () {
          deafMuted = true;
          console.log('Channel is deaf muted');
        })
        .catch(function (err) {
          console.error(err);
        })
        .done();
    }
    else {
      var unmute = Q.denodeify(channel.unmute.bind(channel));
      unmute({direction: 'both'})
        .then(function () {
          deafMuted = false;
          console.log('Channel is no longer deaf muted');
        })
        .catch(function (err) {
          console.error(err);
        })
        .done();
    }
  };

  /**
   * Increases the volume of the audio the channel hears.
   *
   * @param {Object} channel - the channel to change the volume of
   */
  this.incrementListenVolume = function(channel) {
    if (listenCounter < 10) {
      listenCounter++;
      var setVar = Q.denodeify(channel.setChannelVar.bind(channel));
      setVar({variable: LISTEN_VOLUME, value: listenCounter})
        .catch(function (err) {
          console.error(err);
        })
        .done();
    }
  };

  /**
   * Decreases the volume of the audio the channel hears.
   *
   * @param {Object} channel - the channel to change the volume of
   */
  this.decrementListenVolume = function(channel) {
    if (listenCounter > -10) {
      listenCounter--;
      var setVar = Q.denodeify(channel.setChannelVar.bind(channel));
      setVar({variable: LISTEN_VOLUME, value: listenCounter})
        .catch(function (err) {
          console.error(err);
        })
        .done();
    }
  };

  /**
   * Sets the volume of the audio the channel hears back to its default.
   *
   * @param {Object} channel - the channel to change the volume of
   */
  this.resetListenVolume = function(channel) {
    listenCounter = 1;
    var setVar = Q.denodeify(channel.setChannelVar.bind(channel));
    setVar({variable: LISTEN_VOLUME, value: listenCounter})
      .catch(function (err) {
        console.error(err);
      })
      .done();
  };
  
  /**
   * Increases the volume of the audio the channel outputs.
   *
   * @param {Object} channel - the channel to change the volume of
   */
  this.incrementTalkVolume = function(channel) {
    if (talkCounter < 10) {
      talkCounter++;
      var setVar = Q.denodeify(channel.setChannelVar.bind(channel));
      setVar({variable: TALK_VOLUME, value: talkCounter})
        .catch(function (err) {
          console.error(err);
        })
        .done();
    }
  };

  /**
   * Decreases the volume of the audio the channel outputs.
   *
   * @param {Object} channel - the channel to change the volume of
   */
  this.decrementTalkVolume = function(channel) {
    if (talkCounter > -10) {
      talkCounter--;
      var setVar = Q.denodeify(channel.setChannelVar.bind(channel));
      setVar({variable: TALK_VOLUME, value: talkCounter})
        .catch(function (err) {
          console.error(err);
        })
        .done();
    }
  };

  /**
   * Sets the volume of the audio the channel outputs back to its default.
   *
   * @param {Object} channel - the channel to change the volume of
   */
  this.resetTalkVolume = function(channel) {
    talkCounter = 1;
    var setVar = Q.denodeify(channel.setChannelVar.bind(channel));
    setVar({variable: TALK_VOLUME, value: talkCounter})
      .catch(function (err) {
        console.error(err);
      })
      .done();
  };

  /**
   * Changes the pitch of the audio the channel outputs.
   *
   * @param {Object} channel - the channel to change the pitch of
   */
  this.pitchChange = function(channel) {
    if (pitchChanger === 0) {
      var setVar = Q.denodeify(channel.setChannelVar.bind(channel));
      setVar({variable: PITCH_SHIFT, value: 0.7})
        .then(function () {
          pitchChanger++;
        })
        .catch(function (err) {
          console.error(err);
        })
        .done();
    }
    else if (pitchChanger === 1) {
      var setVar = Q.denodeify(channel.setChannelVar.bind(channel));
      setVar({variable: PITCH_SHIFT, value: 'higher'})
        .then(function () {
          pitchChanger++;
        })
        .catch(function (err) {
          console.error(err);
        })
        .done();
    }
    else {
      var setVar = Q.denodeify(channel.setChannelVar.bind(channel));
      setVar({variable: PITCH_SHIFT, value: 1.0})
        .then(function () {
          pitchChanger = 0;
        })
        .catch(function (err) {
          console.error(err);
        })
        .done();
    }
  };

  /**
   * Starts music on hold for a channel.
   *
   * @param {Object} ari - the ARI client
   * @param {Number} chanId - the id of the channel to start moh for
   */
  this.startMoh = function(ari, chanId) {
    var startMoh = Q.denodeify(ari.channels.startMoh.bind(ari));
    startMoh({channelId: chanId})
      .catch(function (err) {
        console.error(err);
      })
      .done();
  };

  /**
   * Stops music on hold for a channel.
   *
   * @param {Object} ari - the ARI client
   * @param {Number} chanId - the id of the channel to stop moh for
   */
  this.stopMoh = function(ari, chanId) {
    var stopMoh = Q.denodeify(ari.channels.stopMoh.bind(ari));
    stopMoh({channelId: chanId})
      .catch(function (err) {
        console.error(err);
      })
      .done();
  };

  /**
   * Lets the follower know that it is waiting for a leader.
   *
   * @param {Object} ari - the ARI client
   * @param {Object} channel - the channel to notify
   * @param {Object} bridge - the bridge the channel is in
   */
  this.waitingForLeader = function(ari, channel, bridge) {
    var playback = ari.Playback();
    var soundToPlay = util.format('sound:%s',
                                  bridge.settings.wait_for_leader_sound);
    var play = Q.denodeify(channel.play.bind(channel));
    play({media: soundToPlay}, playback)
      .catch(function (err) {
        console.error(err);
      })
      .done();
    playback.once('PlaybackFinished', function (event, completedPlayback) {
      self.startMoh(ari, channel.id);
    });
  };

  /**
   * Lets a user know that the conference is being recorded.
   *
   * @param {Object} ari - the ARI client
   * @param {Number} chanId - the channel id of the user
   * @param {Object} bridge - the bridge the channel is in
   */
  this.announceRecording = function(ari, chanId, bridge) {
    if (!bridge.recordingPaused) {
      var soundToPlay = util.format('sound:%s',bridge.settings.recording_sound);
      var play = Q.denodeify(ari.channels.play.bind(ari));
      play({media: soundToPlay, channelId: chanId})
        .catch(function (err) {
          console.error(err);
        })
        .done();
    }
  };

}

module.exports = ChannelMediaModule;
