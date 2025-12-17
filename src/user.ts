class User{

    hauteur: number;
    pmr: boolean;
    dspOnly: boolean;
    
    constructor(hauteur: number, pmr: boolean, dspOnly: boolean){
        this.hauteur = hauteur;
        this.pmr = pmr;
        this.dspOnly = dspOnly;
    }
}

export default User;