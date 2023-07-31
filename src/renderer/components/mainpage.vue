<template>
  <v-app dark>
    <v-container fluid>
      <v-layout>
        <v-flex lg12>
          <v-card v-bind="initialize">
            <v-card-title primary-title>User Info</v-card-title>
            <v-data-table :headers="ui.headers" :items="ui.info" class="elevation-1" hide-actions>
              <template v-slot:items="props">
                <td class="text-xs-left">{{ props.item.id }}</td>
                <td class="text-xs-left">{{ props.item.name }}</td>
                <td class="text-xs-left">{{ props.item.authority }}</td>
              </template>
            </v-data-table>
          </v-card>
        </v-flex>
      </v-layout>
      <v-layout wrap row>
        <v-flex lg2>
          <v-btn @click="requestRefreshUserInfo">Refresh</v-btn>
        </v-flex>
      </v-layout>
      <v-layout>
        <v-flex>
          <p>User ID : </p>
        </v-flex>
        <v-flex>
          <input ref="inputData2" class="inputForm" v-model="ui.datas.userid">
        </v-flex>
        <v-flex>
          <p>User Password : </p>
        </v-flex>
        <v-flex>
          <input ref="inputData3" class="inputForm" v-model="ui.datas.userpassword">
        </v-flex>
        <v-flex>
          <p>User Name : </p>
        </v-flex>
        <v-flex>
          <input ref="inputData4" class="inputForm" v-model="ui.datas.username">
        </v-flex>
        <v-flex>
          <p>User Authority : </p>
        </v-flex>
        <v-flex>
          <input ref="inputData5" class="inputForm" v-model="ui.datas.userauthority">
        </v-flex>
      </v-layout>
      <v-btn @click="requestUserInfo"
      :disabled="dialog"
        :loading="dialog">Create</v-btn>
      <v-dialog v-model="dialog" hide-overlay persistent width="300">
        <v-card dark>
          <v-card-text>
            Create...
            <v-progress-linear indeterminate color="white" class="mb-0"></v-progress-linear>
          </v-card-text>
        </v-card>
      </v-dialog>
    </v-container>
    <v-footer dark app>
      <v-spacer></v-spacer>
      <span>&copy; {{ui.datas.copyRight}} DOOLIM-YASKAWA. Allrights reserved.</span>
    </v-footer>
  </v-app>
</template>

<script>
  export default {
    name: 'main-page',
    data() {
      return {
        dialog: false,
        ui: {
          headers: [
            { text: 'ID', value: 'id' },
            { text: 'Name', value: 'name' },
            { text: 'Authority', value: 'authority' },
          ],
          info: [],
          datas: {
            userid: '',
            userpassword: '',
            username: '',
            userauthority: '',
            copyRight: '',
          }
        }
      }
    },
    computed: {
      initialize() {
        this.requestRefreshUserInfo();
        
      }
    },
    created() {
      this.getCopyRight();
    },
    mounted() {
    },
    watch: {
    dialog (val) {
      if (!val) return;

      setTimeout(() => (this.dialog = false), 4000)
    }
  },
    methods: {
      getCopyRight() {
        this.$http.get(`http://localhost:8000/info/copyright`).then((result) => {
          if (result.data === '') {
            throw new Error('No CopyRight');
          }
          this.ui.datas.copyRight = result.data;
        }).catch((error) => {

        });
      },
      requestRefreshUserInfo() {
        this.$http.get(`http://localhost:8000/auth/users`).then((result) => {
                if (result.data == '') {
                    
                }
                else {
                    this.ui.info = [];
                    for (let idx = 0; idx < result.data.length; ++idx) {
                      this.ui.info.push({
                        id: result.data[idx].user_id,
                        name: result.data[idx].user_name,
                        authority: result.data[idx].user_authority,
                      })
                    }
                }
            }).catch((error) => {
                
            })
      },
      requestUserInfo() {
        if(this.ui.datas.userid != '' && this.ui.datas.userpassword != '') {
          let params = {
            userId: this.ui.datas.userid,
            userName: this.ui.datas.username,
            userPassword: this.ui.datas.userpassword,
            userAuthority: this.ui.datas.userauthority
          }
          this.dialog = true;
          this.$http.post(`http://localhost:8000/auth/register`, params).then((result) => {
              if (result.data == '') {
                  
              }
              else {
                
              }
          }).catch((error) => {

          })
        }
        else {
          let errText = '';
          if(this.ui.datas.userid == '') {
            errText += 'User ID ';
          }
          if(this.ui.datas.userpassword == '') {
            if(errText != '') {
              errText += ', User Password ';
            }
            else {
              errText += 'User Password ';
            }
          }
          errText += "를 확인하세요.";
          alert(errText);
        }
      }
    }
  }
</script>

<style>
  .register {
    width: 100%;
  }
  .inputForm {
    background-color: white;
    color: black;
    width: 80%;
  }
</style>
