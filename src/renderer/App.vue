<template>
  <div id="app">
    <router-view></router-view>
    <v-footer app dark>
        <v-spacer></v-spacer>
        <span>&copy; {{renderCopyRight}} DOOLIM-YASKAWA. Allrights reserved.</span>
    </v-footer>
  </div>
</template>

<script>
  export default {
    data: () => ({
      datas: {

      }
    }),

    created() {
    },

    mounted() {
    },

    destroyed() {
    },

    computed: {
        renderCopyRight() {
            const date = new Date();
            return date.getFullYear();
        }
    },

    methods: {

    }
  }
</script>

<style>
  /* CSS */
  html, body {
    height: 100%;
    width: 100%;
  }

  #app {
      height: 100%;
      width: 100%;
      background-color: #303030;
  }
</style>
