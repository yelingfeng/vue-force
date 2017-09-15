<template>
    <div class="container">
        <div class="main">
            <ForceRelation :option="opt" :renderData="renderData" @nodeClick="nodeClick"></ForceRelation>
            <div class="bg"></div>
        </div>
    </div>
</template>
<script>
    import ForceRelation from './components/ForceRelation.vue'
    import Mock from 'mockjs'
    import $ from 'jquery'
    export default{
        data(){
            return {
                renderData: [],
                opt: {
                    width: 1000,
                    height: 500
                }
            }
        },
        mounted(){
            this.fetchData()
            let me = this;
            $(window).resize(function(){
                me.resizeBox()
            })
        },
        components: {
            ForceRelation
        },
        methods: {
            resizeBox(){
                let width = $(window).width();
                let height = $(window).height();
                this.opt.width  = width;
                this.opt.height = height
            },
            fetchData(){
                const relData = Mock.mock({
                    'array|200': [
                        {
                            'targetName|+1': ['13800000000', '13800000001', '13800000002', '13800000003'],
                            'name|+1': ['138****1211', '151****1345', '156****3123', '138****1111',
                                '139****8888', '153****3212', '152****1223', '153****1111', '157****1371', '135****4123',
                                , '135****1123', '136****1123', '131****8123'],
                            'count': 1
                        }
                    ]
                }).array
                this.renderData = relData
            },
            nodeClick(arg){
                console.log(arg)
            }
        }
    }
</script>
<style scoped>
    body, html {
        margin: 0;
        padding: 0;
    }

    .container {
        display: flex;
        justify-content: center;
    }

    .bg {
        position: absolute;
        background-color: rgba(34, 42, 49, .5);
        left: 0;
        top: 0;
        height: 100%;
        width: 100%;
        z-index: -1;
    }

    .main {
        position: relative;
        width: 100%;
        display: flex;
        justify-content: center;
    }

</style>
