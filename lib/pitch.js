
class Pitch {

    constructor() {
        //this._width = 120 * 5;
        //this._height = 80 * 5;
        this._height = 120 * 5;
        this._width = 80 * 5;
        this._orientation = "vertical"; // "horizontal"

        //this._margin = {left: 30, right: 30, top: 30, bottom: 30};
        this._margin = {left: 0, right: 0, top: 30, bottom: 30};
        //this._dataurl = "/rawdata/data/";
        //this._match_id = 7586;
        this._selection = "body";

        this._events = Promise.resolve([]);
        this._lineup = Promise.resolve([]);
        this._drawtype = "passlocs"; // "passpaths", "players"

        this._timerange = [-1, Infinity];
    }
    orientation(ori, [width, height]) {
        if (ori !== "vertical" && ori !== "horizontal")
            throw Error("invalid argument");
        this._orientation = ori;
        if (width)
            this._width = width;
        if (height)
            this._height = height;
        return this;
    }
    selection(dom) {
        this._selection = dom;
        return this;
    }
    match_id(id) {

        if (this._match_id === id)
            return this;

        this._match_id = id;
        let dataurl = "/rawdata/data/";
        let events = d3.json(dataurl + "events/" + id + ".json");
        let lineup = d3.json(dataurl + "lineups/" + id + ".json");
        this._events = events;
        this._lineup = lineup;
        return this;
    }
    drawtype(type) {
        this._drawtype = type;
        return this;
    }

    match_selector(dom) {
        this._match_selector = dom;
        return this;
    }
    match_selector_load() {
        // This function return a promise as handle
        let _this = this;
        let matches = d3.json("../rawdata/data/matches/43.json");
        let match_selector = d3.select(this._match_selector);

        match_selector.on("change", function() {
            _this.draw();
        });

        let ans = matches.then(function(matches) {
            match_selector.selectAll("option")
                .data(matches)
                .enter()
                .append("option")
                .text(d => d.home_team.home_team_name + " vs " + d.away_team.away_team_name)
                .attr("value", d => d.match_id);
            //let sel_value = match_selector.node().value;
            //_this.match_id(sel_value);
            //_this.draw();
        })
            .catch(err => console.log(err));

        // Return a promise
        return ans;
    }

    time_slider(div) {
        let _this = this;
        let dom = d3.select(div).node();
        let slider = noUiSlider.create(dom, {
            start: [0, 2700], // FIXME: initial slider range
            connect: true,
            behaviour: "drag-tap-hover",
            range: {'min': 0, 'max': 5400}, // FIXME: initial extent of slider
            tooltips: [{to: d => String(Math.floor(d/60)) + ":" + String(Math.round(d % 60))},
                       {to: d => String(Math.floor(d/60)) + ":" + String(Math.round(d % 60))}]
        });
        slider.on("slide", function() {
            //let timerange = slider.get().map(Number.parseFloat);
            //_this.timerange(timerange);
            _this.draw();
        });
        this._time_slider = slider;
        return this;
    }
    time_slider_update() {
        // Update the range of the slider
        // It returns a promise as handle
        let _this = this;

        if (!this._time_slider) {
            console.error("Time slider has not been loaded");
        }
        let slider = this._time_slider;

        // We need the events data to figure out the actual time range
        let ans = this._events.then(function(events) {
            let last_event = events[events.length-1];
            let max_time = last_event.minute * 60 + last_event.second;
            slider.updateOptions({
                range: {'min': 0, 'max': max_time},
            });
            return _this;
        })
            .catch(err => console.log(err));

        // Return a promise as handle
        return ans;
    }
    timerange(range) {
        this._timerange = range;
        return this;
    }
    scaledPitchXGen() {
        let width = this._width;
        let height = this._height;
        let scalePitchX;
        if (this._orientation === "vertical") {
            scalePitchX = d3.scaleLinear().domain([0, 80]).range([width, 0]);
            return function(loc) {
                return scalePitchX(loc[1]);
            };
        }
        else if (this._orientation === "horizontal") {
            scalePitchX = d3.scaleLinear().domain([0, 120]).range([0, width]);
            return function(loc) {
                return scalePitchX(loc[0]);
            };
        }
        else
            throw Error();
    }
    scaledPitchYGen() {
        let width = this._width;
        let height = this._height;
        let scalePitchY;
        if (this._orientation === "vertical") {
            scalePitchY = d3.scaleLinear().domain([0, 120]).range([height, 0]);
            return function(loc) {
                return scalePitchY(loc[0]);
            };
        }
        else if (this._orientation === "horizontal") {
            scalePitchY = d3.scaleLinear().domain([0, 80]).range([height, 0]);
            return function(loc) {
                return scalePitchY(loc[1]);
            };
        }
        else
            throw Error();
    }
    draw_pitch() {

        // Variables
        let width = this._width;
        let height = this._height;
        let margin = this._margin;

        let div = d3.select(this._selection);

        function pitch_template(div, width, height, margin) {

            //var wrapper = main.append('div')
				    //    .attr('id', 'wrapper');
            //var header = wrapper.append('header');
            //var title = header.append('text')
		        //    .text("Soccer Space");

            //var columnLeft = wrapper.append('div')
					  //    .attr('class', 'column')
					  //    .attr('id', 'columnLeft');

            // The svg element
            let innerField = div.append("svg")
                .attr("class", "innerField")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom);

            // Calculate ratio
            let ratio = width/80;
            if (Math.abs(ratio - height/120) > 0.01) {
                console.error("width and height is not consistent",
                              "ratio = " + ratio,
                              "width = " + width,
                              "height = " + height,
                              "Math.abs(ratio - height/120) = " + Math.abs(ratio - height/120));
            }

            innerField.append('rect')
		            .attr('class', 'innerSketch')
		            .attr('x', 36.34*ratio)
		            .attr('y', 3.56*ratio)
		            .attr('width', 7.32*ratio)
		            .attr('height', 2.44*ratio);
            
            innerField.append('rect')
		            .attr('class', 'innerSketch')
		            .attr('x', 36.34*ratio)
		            .attr('y', 126*ratio)
		            .attr('width', 7.32*ratio)
		            .attr('height', 2.44*ratio);

            // The real soccer field
            innerField.append('rect')
		            .attr('class', 'innerSketch')
		            .attr('id', 'border')
		            .attr('x', 0)
		            .attr('y', 6*ratio)
		            .attr('width', 80*ratio)
		            .attr('height', 120*ratio);
            
            innerField.append('line')
		            .attr('class', 'innerSketch')
		            .attr('x1', 0)
		            .attr('y1', 66*ratio)
		            .attr('x2', 80*ratio)
		            .attr('y2', 66*ratio);
            
            innerField.append('circle')
		            .attr('class', 'innerSketch')
		            .attr('cx', 40*ratio)
		            .attr('cy', 66*ratio)
		            .attr('r', 10*ratio);
            
            innerField.append('rect')
		            .attr('class', 'innerSketch')
		            .attr('x', 18*ratio)
		            .attr('y', 6*ratio)
		            .attr('width', 44*ratio)
		            .attr('height', 18*ratio);
            
            innerField.append('rect')
		            .attr('class', 'innerSketch')
		            .attr('x', 18*ratio)
		            .attr('y', 108*ratio)
		            .attr('width', 44*ratio)
		            .attr('height', 18*ratio);
            
            
            innerField.append('rect')
		            .attr('class', 'innerSketch')
		            .attr('x', 30*ratio)
		            .attr('y', 6*ratio)
		            .attr('width', 20*ratio)
		            .attr('height', 6*ratio);
            
            innerField.append('rect')
		            .attr('class', 'innerSketch')
		            .attr('x', 30*ratio)
		            .attr('y', 120*ratio)
		            .attr('width', 20*ratio)
		            .attr('height', 6*ratio);
            
            innerField.append('circle')
		            .attr('class', 'dots')
		            .attr('cx', 40*ratio)
		            .attr('cy', 66*ratio)
		            .attr('r', 0.5*ratio);
            
            innerField.append('circle')
		            .attr('class', 'dots')
		            .attr('cx', 40*ratio)
		            .attr('cy', 17*ratio)
		            .attr('r', 0.5*ratio);
            
            innerField.append('circle')
		            .attr('class', 'dots')
		            .attr('cx', 40*ratio)
		            .attr('cy', 115*ratio)
		            .attr('r', 0.5*ratio);
            
            //draw angles
            function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
	              var angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;
		            return {
				            x: centerX + (radius * Math.cos(angleInRadians)),
				            y: centerY + (radius * Math.sin(angleInRadians))
				        };
            }
            
            function describeArc(x, y, radius, startAngle, endAngle){
	              var start = polarToCartesian(x, y, radius, endAngle);
	              var end = polarToCartesian(x, y, radius, startAngle);
	              var arcSweep = endAngle - startAngle <= 180 ? "0" : "1";
		            if (x==270){
					          var d = [
					              "M", start.x, start.y, 
					              "A", radius, radius, 0, arcSweep, 0, end.x, end.y,
					              "L", start.x, start.y
					          ].join(" ");
					      }else{
						        var d = [
					              "M", start.x, start.y, 
					              "A", radius, radius, 0, arcSweep, 0, end.x, end.y,
					              "L", x,y,
					              "L", start.x, start.y
					          ].join(" ");
                    
					      }
				        return d;       
            }
            
            var arc = [describeArc(0, 6*ratio, ratio, 90, 180),
			                 describeArc(0, 126*ratio, ratio, 0, 90),
			                 describeArc(80*ratio, 6*ratio, ratio, 180, 270),
			                 describeArc(80*ratio, 126*ratio, ratio, 270, 360),
			                 describeArc(40*ratio, 17*ratio, 10*ratio, 135, 225),
			                 describeArc(40*ratio, 115*ratio, 10*ratio, -45, 45),
			                ];
            
            for (var i=0; i < arc.length; i++){
		            innerField.append('path')
				            .attr('class', 'innerSketch')
				            .attr('d', arc[i]);
				    }
        }

        pitch_template(div, width, height, margin);

        // // Append svg to the div
        // let svg = d3.select(this._selection).selectAll("svg").data([0]);
        // let svgenter = svg.enter().append("svg")
        //     .attr("width", width + margin.left + margin.right)
        //     .attr("height", height + margin.top + margin.bottom);

        // // Draw the pitch
        // svgenter.append("rect")
        //     .attr("width", width + margin.left + margin.right)
        //     .attr("height", height + margin.top + margin.bottom)
        //     .style("fill", "grey");
        // svgenter.append("rect")
        //     .attr("x", margin.left)
        //     .attr("y", margin.top)
        //     .attr("width", width)
        //     .attr("height", height)
        //     .style("fill", d3.schemeAccent[0]);

        return this;
    }
    async draw() {
        let _this = this;

        if (this._not_first_draw) {
            console.log("INFO:", "Draw", this._selection);
            // Set the match id if we have the match selector
            if (this._match_selector) {
                let match_selector = d3.select(this._match_selector);
                let sel_value = match_selector.node().value;
                _this.match_id(sel_value);
            }
            if (this._time_slider) {
                // Update the slider range according to the match id
                await _this.time_slider_update();
                // Set the time range according to the slider
                let slider = this._time_slider;
                let timerange = slider.get().map(Number.parseFloat);
                _this.timerange(timerange);
            }

            if (this._drawtype === "passlocs")
                this.draw_passlocs();
            if (this._drawtype === "passpaths")
                this.draw_passpaths();
            if (this._drawtype === "players")
                this.draw_players();
            return this;
        }

        // --------- If this is the first draw --------------- //

        console.log("INFO:", "Init", this._selection);
        // Draw the pitch
        this.draw_pitch();

        // If we have bound a match selector
        if (this._match_selector) {
            // Load the match selector
            await _this.match_selector_load();
            // Set the match id according to the initial option,
            // which is needed to update the slider range
            let match_selector = d3.select(this._match_selector);
            let sel_value = match_selector.node().value;
            _this.match_id(sel_value);
        }
        if (this._time_slider) {
            // Update the slider range according to the match id
            await _this.time_slider_update();
            // Set the time range according to the slider
            let slider = this._time_slider;
            let timerange = slider.get().map(Number.parseFloat);
            await _this.timerange(timerange);
        }

        // Enter the other block and draw it
        this._not_first_draw = true;
        _this.draw();

        return this;
    }

    draw_players() {
        // Variables
        let width = this._width;
        let height = this._height;
        let margin = this._margin;
        let svg = d3.select(this._selection).select("svg");
        let _this = this;

        // Data processing
        let events = this._events
          // Filter by time range
            .then(events => events.filter(d => {
                let time = d.minute * 60 + d.second;
                return time >= d3.min(_this._timerange) && time <= d3.max(_this._timerange);
            }))
          // FIXME: include other types of events that have player information
            .then(events => events.filter(d => d.type.name === "Pass"));
        let lineup = this._lineup;

        Promise.all([events, lineup]).then(function([events, lineup]) {
            // Player locations
            let players = events.reduce(function(players, event) {
                let player_id = event.player.id;
                players[player_id] = players[player_id] || {
                    "id": player_id,
                    "team_id": event.team.id,
                    "locs": []
                };
                players[player_id].locs.push(event.location);
                return players;
            }, Object.create(null));

            // Convert to array
            players = Object.values(players);

            // Player Set in the time range
            let players_set = new Set(players.map(d => d.id));

            // Calculate avg locations
            players.forEach(player => {
                player.avg_loc = [
                    d3.mean(player.locs, d => d[0]),
                    d3.mean(player.locs, d => d[1])
                ];
            });

            // Data driven layer
            let ddlayer = svg
                .selectAll("g.ddlayer")
                .data(["playersL", "linksL"], d => d);
            ddlayer
                .enter()
                .append("g")
                .attr("class", "ddlayer")
                .each(function(d) {
                    d3.select(this).classed(d, true);
                })
                .attr("transform", `translate(${margin.left},${margin.top})`);
            ddlayer
                .exit()
                .remove();

            // Different layers
            let playersL = svg.select("g.playersL");
            let linksL = svg.select("g.linksL");

            let scalePitchX = _this.scaledPitchXGen();
            let scalePitchY = _this.scaledPitchYGen();

            draw_playersL();
            draw_linksL();

            function draw_linksL() {
                let scaleTeamColor = d3.scaleOrdinal()
                    .domain(lineup.map(d => d.team_id))
                    .range(["red", "yellow"]);

                // Only use pass events with a recipient to draw the links and the
                // recipient exists in that time range.
                let events_with_rec = events.filter(d => d.pass.recipient !== undefined &&
                                                    players_set.has(d.pass.recipient.id));
                // TODO: different line types based on events outcome

                let paths = linksL.selectAll("path").data(events_with_rec, d => d.id);
                paths.enter()
                    .append("path")
                    .attr("stroke", d =>  {
                        return scaleTeamColor(d.team.id);
                    })
                    .attr("fill", "none")
                    .attr("stroke-width", "3px")
                    .attr("stroke-opacity", 0.4)

                    .merge(paths)
                    .attr("d", d => {
                        let x = scalePitchX(d.location);
                        let y = scalePitchY(d.location);
                        let xend = scalePitchX(d.pass.end_location);
                        let yend = scalePitchY(d.pass.end_location);

                        let playerloc = players.find(p => p.id == d.player.id).avg_loc;
                        let reciploc  = players.find(p => p.id == d.pass.recipient.id).avg_loc;

                        let dist = Math.pow((Math.pow((yend-y),2) + Math.pow((xend-x),2)), 0.5);
                        let player_avgdist = Math.pow((Math.pow((playerloc[0]-reciploc[0]),2) +
                                                       Math.pow((playerloc[1]-reciploc[1]),2)), 0.5);

                        let r = player_avgdist * (40 / (dist / player_avgdist)); // FIXME


                        let player_x = scalePitchX(playerloc);
                        let player_y = scalePitchY(playerloc);

                        let recip_x = scalePitchX(reciploc);
                        let recip_y = scalePitchY(reciploc);

                        let ans = `M${player_x},${player_y}A${r},${r} 0 0,1 ${recip_x},${recip_y}`;
                        return ans;
                    });
                paths.exit().remove();
            }

            function draw_playersL() {
                let scaleColor = d3.scaleOrdinal()
                    .domain(lineup.map(d => d.team_id))
                    .range(["red", "yellow"]);

                let scaleR = d3.scaleSqrt()
                // FIXME: choose a constant domain and range
                //.domain(d3.extent(players, d => d.locs.length))
                    .domain([0, 30])
                    .range([1, 40]);

                // Draw locations
                let pass_locs = playersL
                    .selectAll("circle.path_start")
                    .data(players, d => d.id);

                pass_locs
                    .enter()
                    .append("circle")
                    .attr("class", "path_start")
                    .attr("cx", d => scalePitchX(d.avg_loc))
                    .attr("cy", d => scalePitchY(d.avg_loc))
                    .attr("opacity", 0.5)

                    .merge(pass_locs)
                    .transition()
                    .duration(100)
                    .attr("r", d => scaleR(d.locs.length))
                    .attr("cx", d => scalePitchX(d.avg_loc))
                    .attr("cy", d => scalePitchY(d.avg_loc))
                    .attr("fill", d => scaleColor(d.team_id));
                pass_locs
                    .exit()
                    .remove();
            }

        })
            .catch(err => console.log(err));
    }

    draw_passpaths() {
        // Variables
        let width = this._width;
        let height = this._height;
        let margin = this._margin;
        let svg = d3.select(this._selection).select("svg");
        let _this = this;

        // Data processing
        let events = this._events
          // Filter by time range
            .then(events => events.filter(d => {
                let time = d.minute * 60 + d.second;
                return time >= d3.min(_this._timerange) && time <= d3.max(_this._timerange);
            }))
          // FIXME: include other types of events that have location information
            .then(events => events.filter(d => d.type.name === "Pass"));
        let lineup = this._lineup;

        // Draw the pass locations
        Promise.all([events, lineup]).then(function([events, lineup]) {
            // Data driven layer
            let ddlayer = svg
                .selectAll("g.ddlayer")
                .data(["pass_paths"], d => d);
            ddlayer
                .enter()
                .append("g")
                .attr("class", "ddlayer")
                .attr("transform", `translate(${margin.left},${margin.top})`);
            ddlayer
                .exit()
                .remove();
            ddlayer = svg.selectAll("g.ddlayer");

            let scalePitchX = _this.scaledPitchXGen();
            let scalePitchY = _this.scaledPitchYGen();

            let scaleColor = d3.scaleOrdinal()
                .domain(lineup.map(d => d.team_id))
                .range(["red", "yellow"]);

            // Draw start locations
            let pass_locs = ddlayer
                .selectAll("circle.path_start")
                .data(events, d => d.id);

            pass_locs
                .enter()
                .append("circle")
                .attr("class", "path_start")
                .attr("r", 2)
                .attr("cx", d => scalePitchX(d.location))
                .attr("cy", d => scalePitchY(d.location))
                .attr("fill", d => scaleColor(d.team.id));
            pass_locs
                .exit()
                .remove();

            // Draw pass paths
            let pass_paths = ddlayer
                .selectAll("line.pass_paths")
                .data(events, d => d.id);

            pass_paths
                .enter()
                .append("line")
                .attr("class", "pass_paths")
                .attr("x1", d => scalePitchX(d.location))
                .attr("y1", d => scalePitchY(d.location))
                .attr("x2", d => scalePitchX(d.pass.end_location))
                .attr("y2", d => scalePitchY(d.pass.end_location))
                .attr("stroke", d => scaleColor(d.team.id));
            pass_paths
                .exit()
                .remove();
            return this;
        })
            .catch(err => console.log(err));

    }

    draw_passlocs() {
        // Variables
        let width = this._width;
        let height = this._height;
        let margin = this._margin;
        let svg = d3.select(this._selection).select("svg");
        let _this = this;

        // Data processing
        let events = this._events
          // Filter by time range
            .then(events => events.filter(d => {
                let time = d.minute * 60 + d.second;
                return time >= d3.min(_this._timerange) && time <= d3.max(_this._timerange);
            }))
          // FIXME: include other types of events that have location information
            .then(events => events.filter(d => d.type.name === "Pass"));
        let lineup = this._lineup;

        // Draw the pass locations
        Promise.all([events, lineup]).then(function([events, lineup]) {
            // Data driven layer
            // Also remove other layers with ddlayer class
            let ddlayer = svg
                .selectAll("g.ddlayer")
                .data(["pass_locs"], d => d);
            ddlayer
                .enter()
                .append("g")
                .attr("class", "ddlayer")
                .attr("transform", `translate(${margin.left},${margin.top})`);
            ddlayer
                .exit()
                .remove();
            ddlayer = svg.selectAll("g.ddlayer");

            let scalePitchX = _this.scaledPitchXGen();
            let scalePitchY = _this.scaledPitchYGen();

            let scaleColor = d3.scaleOrdinal()
                .domain(lineup.map(d => d.team_id))
                .range(["red", "yellow"]);

            let pass_locs = ddlayer
                .selectAll("circle.pass_locs")
                .data(events, d => d.id);

            pass_locs
                .enter()
                .append("circle")
                .attr("class", "pass_locs")
                .attr("r", 2)
                .attr("cx", d => scalePitchX(d.location))
                .attr("cy", d => scalePitchY(d.location))
                .attr("fill", d => scaleColor(d.team.id));
            pass_locs
                .exit()
                .remove();
            return this;
        })
            .catch(err => console.log(err));
    }
}


