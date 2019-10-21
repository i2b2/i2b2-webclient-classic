i2b2.ValueTypes = {};
/* Start Configuration. Note: be careful to keep trailing commas after each parameter */
i2b2.ValueTypes.type = {
	"PosFloat" : "NUMBER",
	"PosInteger" : "NUMBER",
	"Float" : "NUMBER",
	"Integer" : "NUMBER",
	"String" : "STR",
	"largestring" : "LRGSTR",
	"GENOTYPE_GENE" : "GENOTYPE",
	"GENOTYPE_GENE_INDEL" : "GENOTYPE",
	"GENOTYPE_GENE_SNP" : "GENOTYPE",
	"GENOTYPE_RSID" : "GENOTYPE",
	"GENOTYPE_RSID_INDEL" : "GENOTYPE",
	"GENOTYPE_RSID_SNP" : "GENOTYPE",
	"Enum" : "ENUM",
	"DEFAULT" : "NUMBER",
	"PPV" : "PPV"
}

i2b2.LabExpandedFlags = {};
i2b2.LabExpandedFlags.type = {
	/*  A,H,L are included below to show how to set up the expanded lab flags with the default flag values.
	    Note however that it is not possible to use these and the two-character flags at the same time, because indexOf will return false positives, e.g. H and CH */
	//abnormal_default: {name:'Abnormal' , value:'A'},
	//high_default: {name:'High' , value:'H'},
	//low_default: {name:'Low' , value:'L'}, */
	abnormal: {name:'Abnormal' , value:'[A]'},
	high: {name:'High' , value:'[H]'},
	low: {name:'Low' , value:'[L]'},
	crithigh: {name:'Critical High' , value:'[CH]'},
	critlow: {name:'Critical Low' , value:'[CL]'}
};
i2b2.LabExpandedFlags.process = function(flagstouse) {
	flagList = {};
	flagList.flagType = '[N]';
	flagList.flags = [{name:'Normal', value:'@'}];
	
	// incompatible with IE11 - for (const[flag, flagInfo] of Object.entries(i2b2.LabExpandedFlags.type)) {
	Object.entries(i2b2.LabExpandedFlags.type).forEach(function(x) { flag=x[0]; flagInfo=x[1];  
		if(flagstouse.indexOf(flagInfo.value) >=0 ) {
			flagList.flagType += flagInfo.value;
			flagList.flags.push(flagInfo);
		}
	});
	/* If we only have the normal flag, we don't need a flag list */
	if(flagList.flags.length == 1) {
		flagList.flagType = false;
		delete flagList.flags;
	}
	
	return flagList
}

