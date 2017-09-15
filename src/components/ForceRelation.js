/**
 * Created by ylf on 2017/9/11.
 */
import d3 from 'd3'
import  _ from 'lodash'

let config = {
    lineColor: "#c4c5c5",
    defaultColor: ['#f0b638', '#36e969', '#54bda9', '#587cbd']
}

class MyForce {
    constructor(opt) {
        this.init(opt)
    }

    init(opt) {
        this.options = Object.assign({}, opt)
        this.el = this.options.el;
        this.d3Container = d3.select(this.el)
        this.w = parseFloat(this.d3Container.style('width'));
        this.h = parseFloat(this.d3Container.style('height'));
        this.chartSvg = this.d3Container.append("svg").attr({width: this.w, height: this.h})
        this.vp = this.chartSvg.append('g')
        this.calcSize(true)
    }

    render(data) {
        this.originalData = _.cloneDeep(data)
        this.drawChart()
        this.addInteration()
    }

    calcSize(shouldCalcDis) {
        this.w = parseFloat(this.d3Container.style('width'));
        this.h = parseFloat(this.d3Container.style('height'));
        this.boundBox = this.d3Container.node().getBoundingClientRect()
        if (shouldCalcDis) {
            this.minLinkDis = this.w * 0.04
            this.maxLinkDis = this.w * 0.1
        }
        this.maxLinkWidth = this.w * 0.008
        this.maxCircleR = this.h * 0.02
    }

    // 查找最大被叫次数
    findMaxCallCount() {
        let max = 0;
        for (let p in this.callsCount) {
            if (this.callsCount[p] > max) {
                max = this.callsCount[p]
            }
        }
        return max
    }

    // 查找最大的link次数
    findMaxLinkCount() {
        let max = 0;
        this.links.forEach(l => {
            if (l.count > max) {
                max = l.count
            }
        })
        return max
    }

    drawChart() {
        let links = _.cloneDeep(this.originalData)
        let nodesObj = {}
        // 重点人员
        let keysPersions = {}
        let callsCount = {}
        links.forEach(link => {
            keysPersions[link.targetName] = true

            link.source = link.name
            link.target = link.targetName
            link.source = nodesObj[link.source] || ( nodesObj[link.source] = {name: link.source, isSource: true} )
            link.target = nodesObj[link.target] || ( nodesObj[link.target] = {name: link.target} )

            let callCount = callsCount[link.source.name]
            callsCount[link.source.name] = callCount ? callCount + link.count : link.count

            let callCount2 = callsCount[link.target.name]
            callsCount[link.target.name] = callCount2 ? callCount2 + link.count : link.count
        })

        this.callsCount = callsCount
        this.links = links
        this.keysPersions = keysPersions
        this.maxCallCount = this.findMaxCallCount()
        this.maxLinkCount = this.findMaxLinkCount()

        // 节点数组
        let nodes = d3.values(nodesObj)
        let stoneTop = {
            fixed: true,
            x: this.w / 2,
            y: -this.h * .2
        }
        let stoneBottom = {
            fixed: true,
            x: this.w / 2,
            y: this.h * 1.2
        }
        nodes.push(stoneTop, stoneBottom)

        // 创建force
        this.$force = d3.layout.force().nodes(nodes).links(this.links)
            .size([this.w, this.h])
            .gravity(.2)
            .linkDistance(() => {
                return _.random(this.w * .04, this.w * .1)
            })
            .charge(d => {
                return d.fixed ? -1600 : -this.w * .5
            })
            .on('tick', this.initTick.bind(this))
        this.$force.start()
        this.initPath()
        this.initCircle()
        this.initText()
        this.initLabel()
    }

    initLabel() {
        this.$labels = this.vp.append('g').selectAll('text')
    }


    initTick() {
        this.$Path.attr("d", this.calLinkArc)
        this.$Circle.attr("transform", this.transform)
        this.$Text.attr("transform", this.transform)
    }


    initPath() {
        let me = this;
        this.$Path = this.vp.append("g")
            .selectAll("path")
            .data(this.$force.links())
            .enter().append("path")
            .attr({
                'stroke-width': function (d) {
                    // return .5 + d.count / me.maxLinkCount * me.maxLinkWidth
                    return 1
                },
                stroke: config.lineColor,
                fill: 'none'
            })
    }

    initCircle() {
        let me = this;
        this.$Circle = this.vp.append("g")
            .selectAll("circle")
            .data(this.$force.nodes())
            .enter().append("circle")
            .attr({
                r: function (d) {
                    if (d.fixed) {
                        return 0
                    }
                    d.r = 6 + me.callsCount[d.name] / me.maxCallCount * me.maxCircleR
                    return d.r
                },
                fill: function (d) {
                    return me.keysPersions[d.name] ? config.defaultColor[0] : config.defaultColor[1]
                }
            })
            .call(this.$force.drag)
            .on('mouseenter', d => {
                if (this.scale > 3) {
                    return
                }
                d.svgText.style({
                    opacity: 1
                })
            })
            .on('mouseleave', d => {
                if (this.scale > 3) {
                    return
                }
                d.svgText.style({
                    opacity: 0
                })
            })
            .each(function(d) {
                var downtime;
                this.addEventListener('mousedown',function () {
                    downtime = new Date()
                })
                this.addEventListener('mouseup',function () {
                    if(new Date() - downtime < 200){
                        me.circleClick(d)
                    }
                })
            })
    }


    initText() {
        this.$Text = this.vp.append("g").selectAll("text")
            .data(this.$force.nodes())
            .enter()
            .append("text")
            .attr({
                'x': function (d) {
                    d.svgText = d3.select(this)
                    if (d.fixed) {
                        return 0
                    }
                    return d.r
                },
                fill: '#fff',
                "y": '.31em'
            })
            .style({
                opacity: 0,
                "pointer-events": 'none',
                "font-size": '12px'
            })
            .text(d => {
                return d.name
            })
    }


    transform(d) {
        return `translate(${d.x},${d.y})`
    }

    calLinkArc(d) {
        let dx = d.target.x - d.source.x,
            dy = d.target.y - d.source.y,
            dr = Math.sqrt(dx * dx + dy * dy)
        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`
    }

    resize(op) {
        this.w = op.w;
        this.h = op.h;
        this.chartSvg.attr({
            width: this.w,
            height: this.h
        })
        this.$force.size([this.w, this.h]).start()
    }


    mousewheel(c, callback) {
        if (/firefox/i.test(window.navigator.userAgent)) {
            return (function (container, handler) {
                container.addEventListener('DOMMouseScroll', function (e) {
                    handler.call(this, e.detail > 0, e)
                }, false)
            })(c, callback)
        } else {
            return (function (container, handler) {
                container.addEventListener('mousewheel', function (e) {
                    handler.call(this, e.wheelDelta > 0, e)
                }, false)
            })(c, callback)
        }
    }

    addInteration() {
        let me = this;
        let zoomStep = .16
        me.scale = 1
        let transX = 0
        let transY = 0
        let zoomMin = .1
        let zoomMax = 12
        this.mousewheel(this.d3Container.node(), (isDownwards, e) => {
            e.preventDefault()
            if (me.scale > 3) {
                me.$Text.style({
                    opacity: 1
                })
            } else {
                me.$Text.style({
                    opacity: 0
                })
            }
            if (me.scale < zoomMin || me.scale > zoomMax) {
                me.scale < zoomMin ? (me.scale = zoomMin) : (me.scale = zoomMax)
                return
            }
            let left = (e.clientX - me.boundBox.left - transX) / me.scale
            let top = (e.clientY - me.boundBox.top - transY) / me.scale

            if (isDownwards) {
                let zoomIncre = zoomStep * me.scale;
                me.scale += zoomIncre
                if (me.scale > zoomMax) {
                    me.scale = zoomMax
                }
                transX += -left * zoomIncre
                transY += -top * zoomIncre
            } else {
                let zoomIncre = me.scale * zoomStep * .8
                me.scale += -zoomIncre
                if (me.scale < zoomMin) {
                    me.scale = zoomMin
                }
                transX += left * (me.scale / (me.scale + zoomIncre)) * zoomIncre
                transY += top * (me.scale / (me.scale + zoomIncre)) * zoomIncre
            }

            me.vp.transition().attr({
                transform: `translate(${transX},${transY}) scale(${me.scale})`
            })
        })

        this.d3Container.node().addEventListener('mousedown', function (e) {
            e.preventDefault()
            if (e.target !== me.chartSvg.node() && e.target !== me.vp.node()) {
                return
            }
            let downX = e.pageX - transX
            let downY = e.pageY - transY
            let node = this;

            function move_(e) {
                transX = e.pageX - downX
                transY = e.pageY - downY
                me.vp.attr({
                    transform: `translate(${transX},${transY}) scale(${me.scale})`
                })
            }

            function up_() {
                document.removeEventListener('mouseup', up_, false)
                document.removeEventListener('mousemove', move_, false)
            }

            document.addEventListener('mousemove', move_, false)
            document.addEventListener('mouseup', up_, false)
        })
    }

    circleClick(obj){
        if(_.isFunction(this.options.nodeClick)){
            this.options.nodeClick(obj)
        }
    }
}
export default MyForce
