<template>
    <v-layout>
        <v-card>
            <v-layout>
                <LineChart :chartData="datacollections" :options="options" :height="lineHeight">

                </LineChart>
            </v-layout>
        </v-card>
    </v-layout>   
</template>

<script>
    import LineChart from '@/utils/charts/LineChart.js'
    const pidusage = require('pidusage');
    
    export default {
        props: ['lineHeight', 'date', 'defectTimeRatioFlag', 'zones'],
        components: {LineChart},
        data() {
            return {
                usageData: [],
                usageLabels: [],
                count: 0,
                borderColors: [],
                datacollections: null,
                options: {
                    responsive: true,
                    legend: {
                        display: false,
                    },
                    scales: {
                        xAxes: [
                            {
                                position: "bottom",
                                scaleLabel: {
                                    display: true,
                                    labelString: "Use (GB)",
                                    fontFamily: "verdana",
                                    fontColor: "white",
                                },
                                ticks: {
                                    fontFamily: "Montserrat",
                                    fontColor: "grey"
                                }
                            }
                        ],
                        yAxes: [
                            {
                                position: "left",
                                scaleLabel: {
                                    display: true,
                                    labelString: "Memory Usage",
                                    fontFamily: "verdana",
                                    fontColor: "white",
                                },
                                ticks: {
                                    fontFamily: "verdana",
                                    fontColor: "white",
                                    reverse : false,
                                    min: 0,
                                    max: 128
                                },
                            }
                        ],
                    },
                    animation: false,
                }
            }
        },
        mounted() {
            this.receiveMemoryInfoData();
        },
        computed: {
       
        },
        methods: {
            updateData() {
                this.datacollections = {
                    labels: this.usageLabels,
                    datasets: [
                        {
                            data: this.usageData,
                            fill: false,
                            borderColor: 'white'
                        }
                    ],
                }
                if (this.count >= 10) {
                    this.usageData.shift();
                    this.usageLabels.shift();
                }
                this.count++;
            },
            receiveMemoryInfoData() {
                try {
                    this.$socket.on('memory', msg => {
                        let timeInfo = new Date();
                        const time = timeInfo.getHours() + ":" + timeInfo.getMinutes() + ":" + timeInfo.getSeconds();
                        this.usageLabels.push(time);
                        this.usageData.push(Number(msg));
                        this.updateData();
                    });
                }
                catch(e)
                {
                    console.log('wrong data')
                }
            }
        },
        watch: {

        }
    }
</script>

<style>
  
</style>