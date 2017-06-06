(function(namespace) {

  console.log("this is the dev mode");
  
  var __ = namespace,
      _p = __.config.network;

  var makeExtNetwork = function(nodes) {

    function makeGroup(nodes, size) {

      var id = nodes.reduce((a,b) => a + b.id + '-', '').slice(0, -1),
          O, F,
          C = -1,
          l = _p.learning,
          latestChange = -1,
          R = __u.makeVector([
            __.Rand.randUniform(0, Math.sqrt(2)),
            __.Rand.randUniform(0, Math.sqrt(2)),
          ]),
          oldR = {
            x: R.x,
            y: R.y,
          },
          isCollaborative = null,
          delta = 0;

      function r() {
        var d = _p.decay,
            c = __.Net.cycle;

        return c === C ? 1 : 1 / Math.pow(c - C, d);
      };
      function weight() {
        var i = nodes.filter(n => n.i)[0],
            j = nodes.remove(i)[0];

        latestChange = __.Sim.time();
        R.vector = [r() * R.x, r() * R.y];
        oldR = {
          x: R.x,
          y: R.y,
        };
        O = __u.makeVector([
          i.O.x + j.O.x,
          i.O.y + j.O.y,
        ]);
        F = __u.makeVector([
          l * R.x + (1 - l) * O.x,
          l * R.y + (1 - l) * O.y,
        ]);

        return F.len;
      };
      function updateR() {
        var p = Math.pow(F.cos, 2),
            cos = R.cos;

        isCollaborative = __.Rand.drawBernoulli(p);

        R.vector = isCollaborative ? [F.x, R.y] : [R.x, F.y];

        var deltaBB = Math.abs(R.cos - cos);
        var deltaBA = Math.abs(R.cos - O.cos);
        delta = Math.min(deltaBB, deltaBA);
        __.Net.streak = delta < 0.01 ? __.Net.streak + 1 : 0;

        C = __.Net.cycle;
        latestChange = __.Sim.time();
      };

      //Public
      return {
        get id() { return id; },
        get nodes() { return nodes; },
        get latestChange() { return latestChange; },
        get weight() { return weight(); },
        get R() { return R; },

        get oldR() { return oldR; },
        get isCollaborative() { return isCollaborative; },
        get delta() { return delta; },

        updateR,
      };

    };

    var o = __.factories.makeNetwork(nodes),
        cycle = 0,
        streak = 0,
        groups = {},
        currentDyad = null;

    groups.dyads = nodes.kCombinations(2, pair => {
      return makeGroup(pair, nodes.length);
    });

    function interacting() {

      if ((__.Sim.time() - 1) % (nodes.length) === 0) {
        nodes.forEach(n => {
          delete n.i;
          delete n.j;
          n.drawO();
        });
      };

      var i = __.Rand.randItem(nodes),
          _ = i.i = true,
          i_dyads = groups.dyads.filter(g => g.nodes.contains(i)),
          sel = __.Rand.drawByProb(i_dyads, 'weight');

      currentDyad = sel.value,
      currentDyad.wProb = sel.prob;

      currentDyad.updateR();
      updateTie(currentDyad);

      if ((__.Sim.time() - 1) % (nodes.length) === 0) { cycle++ };

    };

    function updateTie(d) {

      var makeTie = d.R.angle <= _p.colThreshold;
      makeTie? o.createTie(d.nodes) : o.removeTie(d.nodes);

    }

    function updateAllTies() {//for Graph

      groups.dyads.forEach(d => updateTie(d))

    }

    // function outputPerPeriod() {
    //
    //   return groups.dyads.map(d => {
    //     return {
    //       time:__.Sim.time(),
    //       dyad: d.id,
    //       get x() { return d.R.x.toFixed(2); },
    //       get y() { return d.R.y.toFixed(2); },
    //       get isChanged() { return d.latestChange === __.Sim.time(); },
    //     };
    //   });
    // };
    function output_all() {
      return output(groups.dyads);
    };
    function output_changed() {
      return output([currentDyad]);
    };

    function output (array) {

      array = array[0] === null ? groups.dyads : array

      return array.map(function(d) {
        return {
          time:__.Sim.time(),
          dyad: d.id,
          oldx: d.oldR.x.toFixed(2),
          oldy: d.oldR.y.toFixed(2),
          isCol: d.isCollaborative,
          x: d.R.x.toFixed(2),
          y: d.R.y.toFixed(2),
          delta: d.delta.toFixed(4),
        };
      });

    };

    //initialize
    updateAllTies();

    //PUBLIC
    return {
      get streak() { return streak },
      set streak(v) { streak = v },
      get cycle() { return cycle },
      get ties() { return o.ties },

      interacting,
      updateAllTies,
      output_all,
      output_changed,

      degrees: o.degrees,
      clustCoeffs: o.clustCoeffs,
      allMeasures: o.allMeasures,

      isFinished: () => streak === _p.streak,
    };

  }

  __.factories.makeExtNetwork = makeExtNetwork

})(this.__ME__)
