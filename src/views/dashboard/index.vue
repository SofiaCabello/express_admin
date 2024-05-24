<template>
  <div class="dashboard-container">
    <el-card class="echart-card" style="width: 47%;">
      <div slot="header" class="clearfix" style="display: flex;">
        <span>7天包裹统计</span>
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
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import * as echarts from 'echarts'
import { getPackage, getBatch, getLogistic } from '@/api/echart'

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
      myChart: null
    }
  },
  created() {},
  mounted() {
    this.initEchartPackage(),
    this.initEchartLogistic()
  },
  methods:{
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
          text: '包裹统计'
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
      this.myChart = echarts.init(document.getElementById('echart-logistic'), null, {width: '500%'})
      
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
      option && this.myChart.setOption(option)
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
      option && this.myChart.setOption(option)
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