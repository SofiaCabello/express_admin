import request from '@/utils/request'

export function getEmployeeList(params) {
  return request({
    url: '/adminEmp/getAllPages',
    method: 'get',
    params
  })
}

export function getLogisticName(params){
  return request({
    url: '/logistic/getLogisticName',
    method: 'get',
    params
  })
}