<template>
        <v-data-table
          :headers="headers"
          :items="users"
          class="elevation-1"
        >
          <template slot="items" slot-scope="props">
            <td>{{ props.item.name }}</td>
            <td class="text-xs-right">{{ props.item.id }}</td>
            <td class="text-xs-right">{{ props.item.session }}</td>
            <td class="text-xs-right">{{ props.item.date }}</td>
            <td class="text-xs-right">{{ props.item.state }}</td>
          </template>
        </v-data-table>
</template>
<script>
    export default {
        data() {
            return {
                headers: [
                    {
                        text: 'User List',
                        align: 'left',
                        sortable: false,
                        value: 'name'
                    },
                    { text: 'id', value: 'id' },
                    { text: 'session', value: 'session' },
                    { text: 'date', value: 'date' },
                    { text: 'state', value: 'state' }
                ],
                users: []
            }
        },
        mounted() {
            this.insertUser();
            this.deleteUser();
        },
        methods: {
            insertUser() {
                try {
                    this.$socket.on('mount', msg => {
                        this.users.push(msg);
                    });
                }
                catch(e)
                {
                    console.log('wrong data')
                }
            },
            deleteUser() {
                try {
                    this.$socket.on('unmount', msg => {
                        this.users.push(msg);
                    });
                }
                catch(e)
                {
                    console.log('wrong data')
                }
            }
        }
    }
</script>

<style>
</style>