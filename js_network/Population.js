(function(namespace) {

  var __ = namespace,
      _p = __.config.population;


  var makePopulation = function() {

    var actors = [];
    var Individual = {

      init: function(id) {
        var _o = this

        _o.id = id;
        _o.index = id;
        _o.foci = [];
        _o.contacts = []
        _o.isVisited = false;
        _o.component = null;
        _o.distanceTemp = 0;
        _o.cc = 0;
        _o.alpha = 0;
        _o.objType = "Actor"

        return _o

      },

      drawO: function() {

        this.alpha = __.Rand.randUniform(0, Math.PI/2)
        //this.alpha = __Rand.randItem([0, Math.PI/2])
        // var pCycle = 12;
        // var oCycle = __.Net.cycle;
        // var oModHP = oCycle % (pCycle/2);
        // var oModFP = oCycle % pCycle;
        // var avgO = Math.PI * (oModFP < pCycle ? oModHP / (pCycle) : (1/2 - oModHP/pCycle));
        // var stdO = Math.PI/4;
        // var alpha = __.Rand.randNormal(avgO, stdO);
        //
        // this.alpha = alpha < 0 ? 0 : alpha > Math.PI/2 ? Math.PI/2 : alpha

        this.O = __u.makeVector([
          Math.cos(this.alpha),
          Math.sin(this.alpha)
        ]);
        // this.O = __u.makeVector([
        //   Math.cos(this.alpha),
        //   Math.sin(this.alpha)
        // ]);
        return this.O
      },

    };

    function init() {
      for (var i = 0; i < _p.size; i++) {
        actors[i] = Object.create(Individual).init(i)
      };
    };
    function outputPerPeriod() {
      return actors.map(function(actor){
        return {
          time: __.Sim.time(),
          actor: actor.id,
          alpha: (actor.alpha/Math.PI).toFixed(2) + ' &pi;'
        };
      });
    };

    //initialize
    init()

    //PUBLIC
    return {
      actors,
      outputPerPeriod,
    };

  };


  __.factories.makePopulation = makePopulation


})(this.__ME__);
