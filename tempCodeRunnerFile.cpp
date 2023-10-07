function func(arr){
        arr.sort( (a, b) => a - b)
        int diff=arr[1]-arr[0];
        for(int i=2;i<arr.size();i++)
        {
            if(arr[i]-arr[i-1]!=diff)return false;
        }
        return true;
}

console.log(func([-68,-96,-12,-40,16]))