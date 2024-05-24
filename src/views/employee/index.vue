<template>
  <!--这是库存药物列表，包含过滤器、表格、分页器-->
  <div class="employee-container">
    <div class="filter-container">
      <el-button type="primary" icon="el-icon-search"  class="filter-item" @click="openFilter">检索</el-button>
      <el-button type="primary" icon="el-icon-edit" style="margin-left: 10px" @click="handleCreate">添加</el-button>
      <el-button :loading="downloadLoading" type="primary" class="filter-item" icon="el-icon-download" @click="handleDownload">导出</el-button>
      <span v-if="isAdmin" style="margin-left: 10px">
        <el-button type="primary" icon="el-icon-upload2" class="filter-item" @click="handleUpload">导入</el-button>
        <el-button type="primary" icon="el-icon-document" class="filter-item" @click="getUploadTemplate">模板</el-button>
        <!--在这里做一个帮助按钮，悬浮时显示-->
        <el-tooltip effect="light"
          content="导入时请使用模板。"
          placement="top" style="margin-left: 5px; color : #409EFF;">
          <i class="el-icon-question filter-item"></i>
        </el-tooltip>
        <transition name="fade">
          <span class="mutiple-selection" v-if="multipleSelection.length > 0" style="margin-left: 13px">
            <el-button type="danger" icon="el-icon-delete" @click="handleMutipleDelete">批量删除</el-button>
            <el-button type="warning" icon="el-icon-edit" @click="handleMutipleUpdate">批量编辑</el-button>
          </span>
        </transition>
      </span>
    </div>

    <el-dialog title="高级检索" :visible.sync="queryFormVisible" width="50%" :close-on-click-modal="false">
      <el-form ref="queryForm" :model="listQuery" label-width="100px" size="mini">
        <el-form-item label="ID" prop="id">
          <el-input v-model="listQuery.id" placeholder="请输入员工ID"></el-input>
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="listQuery.name" placeholder="请输入员工姓名"></el-input>
        </el-form-item>
        <!-- <el-form-item label="工作地点" prop="serveAt">
          <el-autocomplete
            style="width: 80%"
            class="inline-input"
            v-model="listQuery.serveAt"
            :fetch-suggestions="querySearch"
            placeholder="请输入厂家并选择"
            :trigger-on-focus="false"
            @select="handleQuerySelect"
            @change="handleQueryChange"
          ></el-autocomplete>
          <el-button @click="listQuery.producer = ''" style="margin-left: 10px; width: 15%;">重置</el-button>
        </el-form-item> -->
        <!-- TODO: 这里要写一个多级联动的选择框，选择省份、城市、区县 -->
        <el-form-item label="工作地点" prop="serveAt">
         <el-cascader size="small" :options="regionData" v-model="selectedOptions"></el-cascader>
        </el-form-item>
        <el-form-item label="手机" prop="phone">
          <el-input v-model="listQuery.phone" placeholder="请输入员工手机"></el-input>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="listQuery.email" placeholder="请输入员工邮箱"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="queryFormVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleFilter">确 定</el-button>
      </div>
    </el-dialog>
  

    <el-table :key="tableKey" v-loading="listLoading" :data="list" border fit highlight-current-row style="width: 100%" @sort-change="sortChange" @selection-change="handleSelectionChange">
      <el-table-column type="selection" align="center" v-if="isAdmin"></el-table-column>
      <el-table-column label="ID" prop="id" width="200" sortable align="center" :class-name="getSortClass('id')">
        <template slot-scope="{row}">
          <span>{{ row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="姓名" prop="name" width="120" sortable align="center" :class-name="getSortClass('name')">
        <template slot-scope="{row}">
          <span>{{ row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column label="工作地点" prop="serveAt" width="150" sortable align="center" :class-name="getSortClass('serveAt')">
        <template slot-scope="{row}">
          <span>{{ row.serveAt }}</span>
        </template>
      </el-table-column>
      <el-table-column label="手机" prop="phone" width="150" sortable align="center" :class-name="getSortClass('phone')">
        <template slot-scope="{row}">
          <span>{{ row.phone }}</span>
        </template>
      </el-table-column>
      <el-table-column label="邮箱" prop="email" width="150" sortable align="center" :class-name="getSortClass('email')">
        <template slot-scope="{row}">
          <span>{{ row.email }}</span>
        </template>
      </el-table-column>
    <el-table-column label="操作" align="center" width="400px" class-name="small-padding fixed-width">
      <template slot-scope="{row,$index}">
        <el-button type="warning" size="mini" @click="handleUpdate(row)">
          编辑
        </el-button>
        <el-button type="danger" size="mini" @click="handleDelete(row,$index)">
          删除
        </el-button>
      </template>
    </el-table-column>
    </el-table>

    <!--分页器-->
    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList" />

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form ref="dataForm" :rules="rules" :model="temp" label-position="left" label-width="90px" style="margin-left: 30px; margin-right: 30px;">
        <el-form-item label="ID" prop="id">
          <el-input v-model="temp.id" placeholder="请输入ID" disabled ></el-input>
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="temp.name" placeholder="请输入姓名"></el-input>
        </el-form-item>
        <!-- TODO: 这里要写一个多级联动的选择框，选择省份、城市、区县 -->
        <el-form-item label="工作地点" prop="serveAt">
          <el-cascader size="large" :options="regionData" v-model="selectedOptions"></el-cascader>
        </el-form-item>
        <el-form-item label="手机" prop="phone">
          <el-input v-model="temp.phone" placeholder="请输入手机"></el-input>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="temp.email" placeholder="请输入邮箱"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleStatusConfirm(dialogStatus)">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import Pagination from '@/components/Pagination/index'
// import { getRole } from '@/api/user'
import { getEmployeeList, getLogisticName } from '@/api/employee'
import XLSX from 'xlsx';
import {
  provinceAndCityData,
  pcTextArr,
  regionData,
  pcaTextArr,
  codeToText,
} from "element-china-area-data";


export default{
  name:'drugTable',
  components:{ Pagination },
  mounted(){
    // 接受来自跳转的参数
    this.listQuery.id = this.$route.query.id
    console.log(this.listQuery.id)
    this.getList()
  },
  filters:{
    typeFilter(type){
      return typeKeyValue[type]
    }
  },
  data() {
    return {
      regionData,
      selectedOptions: [],
      tableKey: 0,
      list: null,
      allList: null,
      total: 0,
      recordTotal: 0,
      listLoading: true,
      listQuery: {
        pageNo: 1,
        pageSize: 10,
        name: undefined,
        serveAt: undefined,
        phone: undefined,
        email: undefined,
      },
      sortOptions:[
        {label:'编号升序',key:'+id'},
        {label:'编号降序',key:'-id'},
        {label:'库存升序',key:'+stock'},
        {label:'库存降序',key:'-stock'},
        {label:'别名升序',key:'+nickName'},
        {label:'别名降序',key:'-nickName'},
      ],
      temp: {
        id: undefined,
        name: '',
        serveAt: '',
        phone: '',
        email: '',
      },
      dialogFormVisible: false,
      queryFormVisible: false,
      dialogStatus: '',
      textMap: {
        update: '编辑员工',
        create: '添加员工',
        multipleUpdate: '批量编辑员工'
      },
      rules:{ },
      downloadLoading: false,
      producerSuggestions: [],
      purchaseVisible: false,
      recordVisible: false,
      recordList: null,
      recordQuery:{
        page: 1,
        limit: 10,
        sort:'+id',
        id: undefined,
      },
      currentName: '',
      isAdmin: false,
      lastSelectedAddValue: '',
      lastSelectedQueryValue: '',
      multipleSelection: [],
      multiTemp: {
        ids: undefined,
        name: '',
        producer: '',
        specification: '',
        nickName: '',
        formula: '',
        cas: '',
        lab: '',
        location: '',
        layer: '',
        url: '',
        stock: '',
        note: '',
      },
    }
  },
  created() {
    this.getList()
    // this.getRole()
  },
  methods:{
    getList(){
      this.listLoading = true
      getEmployeeList(this.listQuery).then(response => {
        this.list = response.data.contentList
        // 利用regionData把所有地址编码都转换为地址
        for(let i = 0; i < this.list.length; i++){
          // 省份，取前两位
          let provinceCode = String(this.list[i].serveAt).substring(0,2)
          // 城市，取前四位
          let cityCode = String(this.list[i].serveAt).substring(0,4)
          // 区县，取前六位
          let districtCode = String(this.list[i].serveAt).substring(0,6)
          this.list[i].serveAt = codeToText[provinceCode] + codeToText[cityCode] + codeToText[districtCode]
        }
        this.total = response.total
        this.listLoading = false
      })
    },
    openFilter(){
      this.queryFormVisible = true
    },
    getRole(){
      getRole().then(response => {
        this.isAdmin = response.data === 'admin'
      })
    },
    handleFilter(){
      this.listQuery.page = 1
      this.getList()
      // reset temp
      this.queryFormVisible = false
    },
    sortChange(data){
      const { prop,order } = data
      if(prop === 'name'){
        this.sortByName(order)
      }if(prop === 'producer'){
        this.sortByProducer(order)
      }if(prop === 'lab'){
        this.sortByLab(order)
      }if(prop === 'id'){
        this.sortByID(order)
      }if(prop === 'stock'){
        this.sortByStock(order)
      }if(prop === 'nickName'){
        this.sortByNickName(order)
      }if(prop === 'specification'){
        this.sortBySpecification(order)
      }if(prop === 'formula'){
        this.sortByFormula(order)
      }if(prop === 'cas'){
        this.sortByCas(order)
      }
    },
    sortByLab(order){
      if(order === 'ascending'){
        this.listQuery.sort = '+lab'
      }else{
        this.listQuery.sort = '-lab'
      }
      this.getList()
    },
    sortByName(order){
      if(order === 'ascending'){
        this.listQuery.sort = '+name'
      }else{
        this.listQuery.sort = '-name'
      }
      this.getList()
    },
    sortByProducer(order){
      if(order === 'ascending'){
        this.listQuery.sort = '+producer'
      }else{
        this.listQuery.sort = '-producer'
      }
      this.getList()
    },
    sortByID(order){
      if(order === 'ascending'){
        this.listQuery.sort = '+id'
      }else{
        this.listQuery.sort = '-id'
      }
      this.getList()
    },
    sortByStock(order){
      if(order === 'ascending'){
        this.listQuery.sort = '+stock'
      }else{
        this.listQuery.sort = '-stock'
      }
      this.getList()
    },
    sortByNickName(order){
      if(order === 'ascending'){
        this.listQuery.sort = '+nickName'
      }else{
        this.listQuery.sort = '-nickName'
      }
      this.getList()
    },
    sortBySpecification(order){
      if(order === 'ascending'){
        this.listQuery.sort = '+specification'
      }else{
        this.listQuery.sort = '-specification'
      }
      this.getList()
    },
    sortByFormula(order){
      if(order === 'ascending'){
        this.listQuery.sort = '+formula'
      }else{
        this.listQuery.sort = '-formula'
      }
      this.getList()
    },
    sortByCas(order){
      if(order === 'ascending'){
        this.listQuery.sort = '+cas'
      }else{
        this.listQuery.sort = '-cas'
      }
      this.getList()
    },
    resetTemp(){
      this.temp = {
        id: undefined,
        name: '',
        producer: '',
        specification: '',
        nickName: '',
        formula: '',
        cas: '',
        lab: '',
        location: '',
        layer: '',
        url: '',
        stock: '',
        note: '',
      }
    },
    handleCreate(){
      this.resetTemp()
      this.dialogStatus = 'create'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    createData(){
      this.$refs['dataForm'].validate((valid) => {
        if(valid){
          const tempData = Object.assign({},this.temp)
          createDrug(tempData).then(() => {
            this.getList()
            this.dialogFormVisible = false
            this.resetTemp()
          })
        }
      })
    },
    handleUpdate(row){
      this.temp = Object.assign({},row)
      this.dialogStatus = 'update'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    updateData(){
        this.$refs['dataForm'].validate((valid) => {
          if(valid){
            const tempData = Object.assign({},this.temp)
            updateDrug(tempData).then(() => {
              const index = this.list.findIndex(v => v.id === this.temp.id)
              this.list.splice(index,1,this.temp)
              this.dialogFormVisible = false
              this.resetTemp()
              this.getList()
            })
          }
        })
    },
    handleDelete(row, index){
      this.$confirm('此操作将永久删除该试剂, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() =>{
        deleteDrug(row.id).then(() => {
          this.list.splice(index,1)
          this.$message({
            type: 'success',
            message: '删除成功!'
          })
        })
      })
    },
    getAllDataUnderCurrentQuery(){
      return getAll(this.listQuery).then(response => {
        this.allList = response.data
      })
    },
    handleDownload(){
      this.downloadLoading = true
      this.getAllDataUnderCurrentQuery().then(() => {
        import('@/vendor/Export2Excel').then(excel =>{

          const tHeader = ['试剂ID','试剂名','别名','厂家 & 品牌','实验室','位置','层数','规格','库存','化学式','CAS','购买渠道','备注']
          const filterVal = ['id','name','nickName','producer','lab','location','layer','specification','stock','formula','cas','url','note']
          const resultList = this.formatJson(filterVal, this.allList)
          excel.export_json_to_excel({
            header: tHeader,
            data: resultList,
            filename: '药物列表'
          })
          this.downloadLoading = false
        })
      })
    },
    formatJson(filterVal){  
      return this.allList.map(v => filterVal.map(j => {
        if(j === 'type'){
          return typeKeyValue[v[j]]
        }else{
          return v[j]
        }
      }))
    },
    getSortClass: function(key){
      const sort = this.listQuery.sort
      return sort === key ? 'ascending' : sort === '-' + key ? 'descending' : ''
    },
    handlePurchaseRequest(){
      const tempData = Object.assign({},this.purchaseTemp)
      postPurchaseRequest(tempData).then(() => {
        this.purchaseVisible = false
      })
    },
    formatFormula(formula) {
      return formula.replace(/(\d+)/g, '<sub>$1</sub>');
    },
    handleRecord(row){
      this.recordVisible = true
      this.recordQuery.id = row.id
      this.currentName = row.name
      getRecord(this.recordQuery).then(response => {
        this.recordList = response.data
        this.recordTotal = response.total
      })
    },
    resetRecord(){
      this.recordList = null
      this.currentName = ''
      this.recordQuery = {
        page: 1,
        limit: 10,
        sort:'+id',
        id: undefined,
      }
    },
    handleUpload(){
      this.handleImport()
    },
    handleImport() {
      const input = document.createElement('input');
      input.type = 'file';
      input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = e => {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          for(let i = 0; i < jsonData.length; i++){
            createDrug(jsonData[i]).then(() => {
              this.getList()
            })
          }
        };
        reader.readAsArrayBuffer(file);
      };
      input.click();
    },
    getUploadTemplate(){
      this.downloadLoading = true
      import('@/vendor/Export2Excel').then(excel =>{
        const tHeader = ['name','nickName','producer','lab','location','layer','specification','stock','formula','cas','url','note']
        const filterVal = []
        const list = []
        list.push(filterVal)
        excel.export_json_to_excel({
          header: tHeader,
          data: list,
          filename: '药物模板'
        })
        this.downloadLoading = false
      })
    },
    chemsrcUrl(cas){
       return `https://www.chemicalbook.com/Search.aspx?keyword=${cas}`
    },
    querySearch(queryString, cb){
      if(queryString){
        this.producerSuggestions = this.tagList.producerTags.map(item => {
          return {value: item}
        })
        const results = queryString ? this.createFilter(queryString) : this.producerSuggestions
        cb(results)
      }else{
        cb(this.producerSuggestions)
      }
    },
    createFilter(queryString) {
      return this.producerSuggestions.filter(item => {
        return item.value.toLowerCase().indexOf(queryString.toLowerCase()) > -1;
      });
    },
    handleAddSelect(item){
      this.temp.producer = item.value
      this.lastSelectedValue = item.value
    },
    handleAddChange(value){
      // 强制用户选择建议中的值
      if(!this.producerSuggestions.some(item => item.value === value)){
        this.$message({
          type: 'error',
          message: '请选择建议中的值'
        })
        this.temp.producer = this.lastSelectedValue
      }
    },
    handleQuerySelect(item){
      this.listQuery.producer = item.value
      this.lastSelectedQueryValue = item.value
    },
    handleQueryChange(value){
      // 强制用户选择建议中的值
      if(!this.producerSuggestions.some(item => item.value === value)){
        this.$message({
          type: 'warning',
          message: '请选择建议中的值'
        })
        this.listQuery.producer = this.lastSelectedQueryValue
      }
    },
    handleSelectionChange(val){
      this.multipleSelection = val
    },
    handleMutipleDelete(){
      this.$confirm('此操作将永久删除这些试剂, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() =>{
        for(let i = 0; i < this.multipleSelection.length; i++){
          deleteDrug(this.multipleSelection[i].id)
        }
        this.$message({
          type: 'success',
          message: '删除成功!'
        })
        this.getList()
      })
    },
    handleMutipleUpdate(){
      this.resetTemp()
      this.dialogStatus = 'multipleUpdate'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    multipleUpdateData(){
      this.$refs['dataForm'].validate((valid) => {
        if(valid){
          let idArr = []
          for(let i = 0; i < this.multipleSelection.length; i++){
            idArr.push(this.multipleSelection[i].id)
          }
          const tempData = Object.assign({},this.temp)
          tempData.ids = idArr
          multipleUpdateDrug(tempData).then(() => {
            this.getList()
            this.dialogFormVisible = false
            this.resetTemp()
          })
        }
      })
    },
    handleStatusConfirm(status){
      if(status === 'create'){
        this.createData()
      }else if(status === 'update'){
        this.updateData()
      }else if(status === 'multipleUpdate'){
        this.multipleUpdateData()
      }
    }
  }
}

</script>

<style lang="scss" scoped>
.filter-container{
  margin-top: 15px;
  margin-bottom: 15px;
  margin-left: 15px;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity .3s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>