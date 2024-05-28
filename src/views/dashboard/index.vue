<template>
  <div class="dashboard-container">
    <el-card class="echart-card" style="width: 47%;">
      <div slot="header" class="clearfix" style="display: flex;">
        <span>7天统计</span>
      </div>
      <div id="echart-package" style="width: 100%; height: 400px" class="echart"></div>
    </el-card>
    <el-card class="echart-card" style="width: 47%;">
      <div slot="header" class="clearfix" style="display: flex; justify-content: space-between; align-items: center;">
        <span>各级网点统计</span>
        <div style="flex-grow: 1;"></div>
        <el-radio-group v-model="type" @change="handleTypeChange">
          <el-radio-button label="省份"></el-radio-button>
          <el-radio-button label="城市"></el-radio-button>
          <el-radio-button label="区县"></el-radio-button>
        </el-radio-group>
      </div>
      <div id="echart-logistic" style="width: 100%; height: 400px;" class="echart"></div>
    </el-card>
    <el-card class="echart-card" style="width:47%; margin-top: 40px;">
      <div slot="header" class="clearfix" style="display: flex;">
        <span>包裹出发地占比</span>
      </div>
      <div id="echart-package-origin" style="width: 100%; height: 400px" class="echart"></div>
    </el-card>
    <el-card class="echart-card" style="width:47%; margin-top: 40px;">
      <div slot="header" class="clearfix" style="display: flex;">
        <span>包裹目的地占比</span>
      </div>
      <div id="echart-package-destination" style="width: 100%; height: 400px" class="echart"></div>
    </el-card>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import * as echarts from 'echarts'
import { getPackage, getBatch, getLogistic, getTotalPackageCount, getPackageDestination, getPackageOrigin } from '@/api/echart'

export default {
  name: 'Dashboard',
  computed: {
    ...mapGetters([
      'name'
    ])
  },
  data() {
    return {
      type: '城市',
      param: {
        level: 'city'
      },
      LChart: null,
      totalPackageCount: 0,
    }
  },
  created() {
    this.getTotalPackageCount()
  },
  mounted() {
    this.initEchartPackage(),
    this.initEchartLogistic(),
    this.initEchartPackageOrigin(),
    this.initEchartPackageDestination()
  },
  methods:{
    getTotalPackageCount(){
      getTotalPackageCount().then(res => {
        this.totalPackageCount = res.data
        console.log(this.totalPackageCount)
      })
    },
    handleTypeChange(){
      this.param.level = this.type === '省份' ? 'province' : this.type === '城市' ? 'city' : 'district'
      this.updateData()
    },
    async initEchartPackage() {
      const myChart = echarts.init(document.getElementById('echart-package'))
      const packageData = await getPackage()
      const batchData = await getBatch()
      console.log(packageData)
      const option = {
        title: {
          text: '包裹和批次统计'
        },
        tooltip: {},
        legend: {
          data:['包裹数', '批次数']  // 从七天前到今天
        },
        xAxis: {
          data: this.getLastSevenDays()
        },
        yAxis: {
          type: 'value'
        },
        series: [{
          name: '包裹数',
          type: 'line',
          smooth: true,
          data: packageData.data
        },
        {
          name: '批次数',
          type: 'line',
          smooth: true,
          data: batchData.data
        }
      ]
      }
      option && myChart.setOption(option)
    },
    getLastSevenDays(){
      const result = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const month = `${d.getMonth() + 1}`.padStart(2, '0');
        const day = `${d.getDate()}`.padStart(2, '0');
        result.unshift(`${month}-${day}`);
      }
      return result;
    },
    async initEchartLogistic(){
      this.LChart = echarts.init(document.getElementById('echart-logistic'), null, {width: '500%'})
      
      const logisticData = await getLogistic(this.param)
      const data = this.parseJsonData(logisticData.data)
      const option = {
        title: {
          text: '各级网点统计'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        grid: {
          bottom: '15%'
        },
        xAxis: {
          type: 'category',
          data: data.map(item => item.province),
          axisLabel: {
            rotate: 90
          }
        },
        yAxis: {
          type: 'value'
        },
        dataZoom: [
          {
            type: 'slider',
            start: 0,
            end: 60
          }
        ],
        series: [
          {
            name: '网点数',
            type: 'bar',
            data: data.map(item => item.value),
            
            barWidth: 10,
            showBackground: true,
            backgroudStyle: {
              color: 'rgba(220, 220, 220, 0.8)'
            },
            emphasis: {
              itemStyle: {
                color: 'orange'
              }
            }
          }
        ]
      }
      option && this.LChart.setOption(option)
    },
    async initEchartPackageOrigin(){
      const myChart = echarts.init(document.getElementById('echart-package-origin'))
      const originData = await getPackageOrigin()
      const top10 = originData.data.slice(0, 10)
      const other = originData.data.slice(10)
      const otherCount = other.reduce((prev, cur) => prev + cur.count, 0)
      top10.push({logistic_name: '其他', count: otherCount})
      const option = {
        backgroundColor: 'white',
        title: {
          text: '包裹出发地占比',
          // left: 'center',
          top: 20,
          textStyle: {
            color: '#000'
          }
        },
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b} : {c} ({d}%)'
        },
        visualMap: {
          show: false,
          min: 0,
          max: top10[0].count,
          inRange: {
            colorLightness: [0, 1.3]
          }
        },
        series: [
          {
            name: '包裹出发地占比',
            type: 'pie',
            radius: '90%',
            center: ['45%', '60%'],
            // originData.data是区域-数量的键值对，已经排序好了
            data: top10.map(item => {
              return {
                name: item.logistic_name,
                value: item.count
              }
            }),
            roseType: 'radius',
            label: {
              color: 'rgba(0, 0, 0, 0.3)',
            },
            labelLine: {
              lineStyle: {
                color: 'rgba(0, 0, 0, 0.3)'
              },
              smooth: 0.2,
              length: 10,
              length2: 20
            },
            itemStyle:{
              shadowBlur: 30,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            },
            animationType: 'expansion',
            animationEasing: 'cubicInOut',
            animationDelay: function(idx) {
              return Math.random() * 200
            }
          }
        ]
      }
      option && myChart.setOption(option)
    },
    async initEchartPackageDestination(){
      const myChart = echarts.init(document.getElementById('echart-package-destination'))
      const destinationData = await getPackageDestination()
      const top10 = destinationData.data.slice(0, 10)
      const other = destinationData.data.slice(10)
      const otherCount = other.reduce((prev, cur) => prev + cur.count, 0)
      top10.push({logistic_name: '其他', count: otherCount})
      const option = {
        backgroundColor: 'white',
        title: {
          text: '包裹目的地占比',
          // left: 'center',
          top: 20,
          textStyle: {
            color: '#000'
          }
        },
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b} : {c} ({d}%)'
        },
        visualMap: {
          show: false,
          min: 0,
          max: top10[0].count,
          inRange: {
            colorLightness: [0, 1.3]
          }
        },
        series: [
          {
            name: '包裹目的地占比',
            type: 'pie',
            radius: '90%',
            center: ['45%', '60%'],
            // destinationData.data是区域-数量的键值对，已经排序好了
            data: top10.map(item => {
              return {
                name: item.logistic_name,
                value: item.count
              }
            }),
            roseType: 'radius',
            label: {
              show: true,
              color: 'rgba(0, 0, 0, 0.3)'
            },
            labelLine: {
              lineStyle: {
                color: 'rgba(0, 0, 0, 0.3)'
              },
              smooth: 0.2,
              length: 10,
              length2: 20
            },
            itemStyle:{
              shadowBlur: 30,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            },
            animationType: 'expansion',
            animationEasing: 'cubicInOut',
            animationDelay: function(idx) {
              return Math.random() * 200
            }
          }
        ]
      }
      option && myChart.setOption(option)
    },
    async updateData(){
      const logisticData = await getLogistic(this.param)
      const data = this.parseJsonData(logisticData.data)
      const option = {
        xAxis: {
          data: data.map(item => item.province)
        },
        series: [
          {
            data: data.map(item => item.value)
          }
        ]
      }
      option && this.LChart.setOption(option)
    },
    parseJsonData(data){
      const result = []
      for (const key in data) {
        result.push({
          province: key,
          value: data[key][0]
        })
      }
      result.sort((a, b) => b.value - a.value)
      return result
    }
  }
}
</script>

<style lang="scss" scoped>
.dashboard {
  &-container {
    margin: 30px;
  }
  &-text {
    font-size: 30px;
    line-height: 46px;
  }
}

.dashboard-container {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  .echart-card {
    .clearfix {
      height: 40px;
      // 垂直居中
      display: flex;
      align-items: center;
    }
    .echart {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
  }
}
</style>