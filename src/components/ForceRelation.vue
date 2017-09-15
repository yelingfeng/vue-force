<template>
    <div ref="chart" class="chart" :style="chartStyle"></div>
</template>
<script>
    import ForceRelation from './ForceRelation.js'
    export default{
        props: [
            'option',
            'renderData'
        ],
        watch: {
            renderData(newval){
                if (newval && newval) {
                    this.F.render(newval)
                }
            },
            option:{
              deep:true,
              handler(newval){
                  if (newval) {
                      this.F.resize({w: newval.width, h: newval.height})
                  }
              }
            }
        },
        computed: {
            chartStyle(){
                return {
                    width: this.option.width + 'px',
                    height: this.option.height + 'px'
                }
            }
        },
        data(){
            return {}
        },
        mounted(){
            const me = this;
            this.F = new ForceRelation({
                el: this.$refs.chart,
                nodeClick: function (...arg) {
                    me.clickHandler(...arg)
                }
            })
        },
        components: {
            ForceRelation
        },
        methods: {
            clickHandler(arg){
                this.$emit('nodeClick', arg.name)
            }
        }
    }
</script>
<style>
</style>
