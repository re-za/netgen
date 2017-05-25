(function(namespace) {

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

// interact: function(reference) {
//   var o = this;
//   var r = reference || this
//
//   //interaction updates the X and Y of the group
//   o.x = _o.x + r.cos;
//   _o.y = _o.y + r.sin;
//   _o.latestChange = __.Sim.time()
//
//   //translate triadic interaction to underlying dyads
//   if ( _o.nodes.length > 2 ) {
//     __.Net.innerDyads(_o).forEach(function(d, i) {
//
//       if (_p.triadTranslation === 'subs') {
//         d.interact(_o)
//       }
//       else if (_p.triadTranslation === 'max') {
//         d.x = d.x + Math.max(t.cos, d.cos)
//         d.y = d.y + Math.max(t.sin, d.sin)
//         d.latestChange = __.Sim.time()
//       };
//     });
//   };
//
//   return _o;
// },
// var groupType = __.Rand.drawBernoulli(_p.probTriad) ? 'triads' : 'dyads'
// groupType === 'triads' ? o.triadsSelected++ : o.dyadsSelected++
// o.innerDyads = function(group) {
//
//   return group.nodes.kCombinations(2, function(nn) {
//     return o.dyadByNodes(nn)
//   })
//
// }
// o.dyadByNodes = function(nodes) {
//
//   return o.groups.dyads.filter(function(d) {
//     return d.nodes.contains(nodes[0]) && d.nodes.contains(nodes[1])
//   })[0]
//
// }
// updateRelationVector: function() {
//   var l = _p.learning,
//       //_V = this.coopVector().abs(),
//       //_R = this.relationVector.abs(),
//       V = this.potCoopVector,
//       len(V) = Math.sqrt(V[0] * V[0] + V[1] * V[1]);
//
//
//
//       R = this.latestChange === -1 ? _V : [
//         (1 - l) * _V[0] + l * _R[0],
//         (1 - l) * _V[1] + l * _R[1]
//       ],
//       _length = Math.sqrt(R[0] * R[0] + R[1] * R[1]),
//       _cos = _length === 0 ? 0 : R[0] / _length,
//       _sin = _length === 0 ? 0 : R[1] / _length;
//
//   this.cos = _cos
//   this.cos2 = _cos * _cos;
//   this.sin2 = _sin * _sin;
//
//   if (__.Rand.drawBernoulli(this.cos2)) {
//     this.relationVector = R
//     this.latestChange = __.Sim.time()
//     this.latestCycle = __.Net.cycle
//   }
// },
// get V() {
//   var o = this,
//       l = _p.learning,
//       i = o.nodes.filter(n => n.i)[0];
//
//   o.O = i.O;
//   if (len(o.R) === 0) {
//     return o.O
//   } else {
//     var _O = [
//           Math.cos((1 - l) * i.alpha),
//           Math.sin((1 - l) * i.alpha)
//         ],
//         _R = [
//           Math.pow(len(o.R), l) * Math.cos(l * o.b),
//           Math.pow(len(o.R), l) * Math.sin(l * o.b)
//         ];
//
//     return [
//       _O[0] + _R[0],
//       _O[1] + _R[1]
//     ];
//   }
// },
// var ExtNetworkFactory = (function() {
//
//   var len = v => Math.sqrt(v[0] * v[0] + v[1] * v[1]),
//       longer = (v, w) => len(v) >= len(w) ? v : w,
//       shorter = (v, w) => len(v) >= len(w) ? w : v;
//
//   var Group = {
//
//     init: function(nodes) {
//       var o = this
//       o.nodes = nodes
//       o.id = o.nodes
//         .reduce((a,b) => a + b.id + '-', '')
//         .slice(0, -1)
//       o.latestChange = -1
//       o.C = -1
//       o.R = [0, 0]
//
//       return o
//     },
//     get r() {
//       var o = this,
//           d = _p.decay,
//           c = __.Net.cycle;
//
//       return c === o.C ? 1 : 1 / Math.pow(c - o.C, d);
//     },
//     get V() {
//       var o = this,
//           l = _p.learning,
//           i = o.nodes.filter(n => n.i)[0];
//
//       o.O = i.O;
//       return o.latestChange === -1 ? o.O : [
//         (1 - l) * o.O[0] + l * o.r * o.R[0],
//         (1 - l) * o.O[1] + l * o.r * o.R[1]
//       ];
//     },
//     get weight() {
//       var o = this;
//
//       return Math.pow(len(o.V), 2);
//     },
//     get b() {
//       var o = this,
//           cosB = len(o.R) !== 0 ? o.R[0]/len(o.R) : o.O[0];
//
//       return Math.acos(cosB)
//     },
//     get g() {
//       var o = this,
//           cosG = o.V[0]/len(o.V);
//
//       return Math.acos(cosG)
//     },
//     updateR: function(j_dyads) {
//       var o = this,
//           sum2 = j_dyads.reduce((a, b) => a + len(b.R)*len(b.R), 0),
//           lenRj = Math.sqrt(sum2 + len(o.V)*len(o.V)),
//           p = Math.pow(len(o.V) / lenRj, 2),
//           isAccepted = __.Rand.drawBernoulli(p),
//           // _m = isAccepted ? 1/Math.max(p, o.prob) : Math.max(p, o.prob),
//
//           q = Math.pow(Math.cos(o.g), 2),
//           isCollaborative = __.Rand.drawBernoulli(q),
//           _b = isCollaborative ? Math.min(o.g, o.b) : Math.max(o.g, o.b);
//
//       o.R = isAccepted ? longer(o.R, o.V) : shorter(o.R, o.V)
//       // o.R = [
//       //   _m * o.V[0],
//       //   _m * o.V[1],
//       // ];
//       o.R = [
//         Math.cos(_b) * len(o.R),
//         Math.sin(_b) * len(o.R),
//       ]
//
//       o.C = __.Net.cycle;
//       o.latestChange = __.Sim.time();
//     },
//
//   }
//
//   var o = Object.create(__.protos.Network)
//
//   o.init = function(nodes) {
//
//     o.groups = {}
//     o.cycle = 1
//     o.distanceMatrix = []
//     __.protos.Network.init.call(o, nodes)
//
//     o.groups.dyads = o.nodes.kCombinations(2, nodes => {
//       return Object.create(Group).init(nodes)
//     })
//
//     return o
//   }
//   o.interacting = function () {
//
//     o.nodes.forEach(n => n.i = false)
//
//     var i = __.Rand.randItem(o.nodes),
//         _ = i.i = true,
//         _ = i.drawO(),
//         i_dyads = o.groups.dyads.filter(g => g.nodes.contains(i)),
//         sel = __.Rand.drawByProb(i_dyads, 'weight'),
//         d = sel.value,
//         _ = d.wProb = sel.prob,
//         j = d.nodes.remove(i)[0],
//         j_dyads = o.groups.dyads.filter(g => g.nodes.contains(j) && g !== d);
//
//     d.updateR(j_dyads)
//     o.updateTie(d)
//
//     if (__.Sim.time() % (2) === 0) { o.cycle++ }
//
//     return o
//
//   }
//   o.updateTie = function (d) {
//
//     var makeTie = d.R[0] >= _p.colThreshold
//     makeTie ? o.createTie(d.nodes) : o.removeTie(d.nodes)
//
//   }
//   o.updateAllTies = function () {//for Graph
//
//     o.groups.dyads.forEach(d => o.updateTie(d))
//
//   }
//   o.outputPerPeriod = function() {
//
//     return o.groups.dyads.map(d => {
//       return {
//         time:__.Sim.time(),
//         dyad: d.id,
//         get x() { return d.R[0].toFixed(2) },
//         get y() { return d.R[1].toFixed(2) },
//         get isChanged() { return d.latestChange === __.Sim.time() },
//       }
//     })
//   }
//
//   return o
//
// })()
// var ExtNetworkFactory = (function() {
//
//   var Group = {
//     init: function(nodes) {
//       var o = this
//       o.nodes = nodes
//       o.id = o.nodes.reduce((a,b) => a + b.id + '-', '').slice(0, -1)
//       o.R = {
//         len: 1 / (o.nodes - 1),
//         _b: Math.PI/4,
//         set b(v) { this._b = v },
//         get b() { return this.len !== 0 ? this._b : Math.acos(o.O[0]) },
//         get x() { return this.len * Math.cos(this.b) },
//         get y() { return this.len * Math.sin(this.b) },
//       }
//       o.latestChange = -1
//       o.C = -1
//
//       return o
//     },
//     get weight() {
//       var o = this,
//           l = _p.learning,
//           i = o.nodes.filter(n => n.i)[0],
//           a = i.alpha;
//
//       o.O = i.O;
//       return o.R.len * ((1 - l) * Math.cos(a - o.R.b) + l * Math.cos(o.R.b));
//     },
//     updateR: function() {
//       var o = this,
//           p = () => Math.pow(Math.cos(o.R.b), 2),
//           isAccepted = __.Rand.drawBernoulli(p()),
//           m = isAccepted ? (1 + o.wProb) : (1 - o.wProb),
//           cosG2 = () => isAccepted ? Math.min(p() * m, 1) : Math.max(p() * m, 0);
//
//       o.R.len = m * o.R.len
//       o.R.b = Math.acos(Math.sqrt(cosG2()));
//
//       o.C = __.Net.cycle;
//       o.latestChange = __.Sim.time();
//     },
//
//   };
//
//   var o = Object.create(__.protos.Network)
//
//   o.init = function(nodes) {
//
//     o.groups = {}
//     o.cycle = 1
//     o.distanceMatrix = []
//     __.protos.Network.init.call(o, nodes)
//
//     o.groups.dyads = o.nodes.kCombinations(2, nodes => {
//       return Object.create(Group).init(nodes)
//     })
//
//     return o
//   }
//   o.interacting = function () {
//
//     o.nodes.forEach(n => n.i = false)
//
//     var i = __.Rand.randItem(o.nodes),
//         _ = i.i = true,
//         _ = i.drawO(),
//         i_dyads = o.groups.dyads.filter(g => g.nodes.contains(i)),
//         sel = __.Rand.drawByProb(i_dyads, 'weight'),
//         d = sel.value,
//         _ = d.wProb = sel.prob;
//         // j = d.nodes.remove(i)[0],
//         // j_dyads = o.groups.dyads.filter(g => g.nodes.contains(j) && g !== d);
//
//     d.updateR()
//     o.updateTie(d)
//
//     if (__.Sim.time() % (2) === 0) { o.cycle++ }
//
//     return o
//
//   }
//   o.updateTie = function (d) {
//
//     var makeTie = d.R.x >= _p.colThreshold
//     makeTie ? o.createTie(d.nodes) : o.removeTie(d.nodes)
//
//   }
//   o.updateAllTies = function () {//for Graph
//
//     o.groups.dyads.forEach(d => o.updateTie(d))
//
//   }
//   o.outputPerPeriod = function() {
//
//     return o.groups.dyads.map(d => {
//       return {
//         time:__.Sim.time(),
//         dyad: d.id,
//         get x() { return d.R.x.toFixed(2) },
//         get y() { return d.R.y.toFixed(2) },
//         get isChanged() { return d.latestChange === __.Sim.time() },
//       }
//     })
//   }
//
//   return o
//
// })()
