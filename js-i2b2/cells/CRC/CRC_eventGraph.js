/**
* @projectDescription	This is a graph model for detecting compatiple temporal query patterns in the Simple Temporal Query UI.
* @inherits 	none
* @namespace	
* @author		Taowei David Wang (tdw9)
* @version 	1.0
* ----------------------------------------------------------------------------------------
*
*/


function TQueryEventGraph()
{
    this.initialize = function()
    {
        this.nodes = {};
        this.edges = [];
    };

    this.addEdge = function( edge )
    {
        this.edges.push( edge );
    };

    this.normalizeAndSortEdges = function()
    {
        for ( var i = 0; i < this.edges.length; i++ )
        {
            var edge = this.edges[i];
            edge.normalizeDirection();
        }
        this.edges.sort( function(a, b) // Sort edges so that '=' are last
        {           
            if ( a.type == "LESS" && b.type == "EQUAL")      return -1;
            if ( a.type == "LESSEQUAL" && b.type == "EQUAL") return -1;
            if ( a.type == "EQUAL" && b.type == "LESSEQUAL") return 1;
            if ( a.type == "EQUAL" && b.type == "LESS")      return 1;
            return 0;
        });
    };

    this.buildTopology = function()
    {
        // this.edges must already be sorted by this.normalizeAndSordEdges. EQUAL edges are last.
        var esi = -1; // equalStartingIndex
        for ( var i = 0; i < this.edges.length; i++ )
        {
            var edge = this.edges[i];
            if (esi == -1 && edge.type == "EQUAL" )
                esi = i;
            // create new nodes if necessary and add edge to nodes
            var sourceNode = null;
            var targetNode = null;
            if (this.nodes[edge.sourceID])
                sourceNode = this.nodes[edge.sourceID];
            else
            {
                sourceNode = new TQueryGraphNode( edge.sourceID );
                this.nodes[edge.sourceID] = sourceNode;
            }
            if (this.nodes[edge.targetID])
                targetNode = this.nodes[edge.targetID];
            else
            {
                targetNode = new TQueryGraphNode( edge.targetID );
                this.nodes[edge.targetID] = targetNode;
            }
            sourceNode.addEdgeOut(edge);
            targetNode.addEdgeIn(edge);
        }

        // tdw9: fixing JIRA BIOB 64
        // tdw9: added the following to swap source and target nodes of equal relationships that may make topology non-merging or non-branching.
        if (esi < 0 ) return; // if there are no equal edges, there is nothing to do

        // refine topology by changing equal edge directions if necessary
        for (var i = esi; i< this.edges.length; i++ )
        {
            var edge = this.edges[i];
            var sourceNode = this.nodes[edge.sourceID];
            var targetNode = this.nodes[edge.targetID];
            if (sourceNode.edgeOuts.length > 2)
                return; // cannot fix
            if (sourceNode.edgeOuts.length == 2) // 0 and 1 do not need fixing. 2 may be fixed. >2 is not supported.
            {
                var theOtherEdge = sourceNode.edgeOuts[0];
                if (theOtherEdge == edge )
                    theOtherEdge = sourceNode.edgeOuts[1];
                // detach from targetNode
                for (var j=0; j<targetNode.edgeIns.length; j++)
                {
                    if (targetNode.edgeIns[j] == edge)
                    {
                        targetNode.edgeIns.splice(j, 1); 
                        break;
                    }
                }
                // detach from sourceNode
                for (var j=0; j<sourceNode.edgeOuts.length; j++)
                {
                    if (sourceNode.edgeOuts[j] == edge)
                    {
                        sourceNode.edgeOuts.splice(j, 1); 
                        break;
                    }
                }
                // swap values of source and target nodes
                var tempRefDate     = edge.refDate1;
                var tempAggregateOp = edge.aggregateOp1;
                var tempID          = edge.sourceID;
                edge.sourceID       = edge.targetID;
                edge.refDate1       = edge.refDate2;
                edge.aggregateOp1   = edge.aggregateOp2;                    
                edge.targetID       = tempID;
                edge.refDate2       = tempRefDate;
                edge.aggregateOp2   = tempAggregateOp;
                // re-attach edge back to new source and target:
                this.nodes[edge.sourceID].addEdgeOut(edge);
                this.nodes[edge.targetID].addEdgeIn(edge);
            }
            else if (targetNode.edgeIns.length == 2) // 0 and 1 do not need fixing. 2 may be fixed. >2 is not supported.
            {
                var theOtherEdge = targetNode.edgeIns[0];
                if (theOtherEdge == edge )
                    theOtherEdge = targetNode.edgeIns[1];

                // detach from targetNode
                for (var j=0; j<targetNode.edgeIns.length; j++)
                {
                    if (targetNode.edgeIns[j] == edge)
                    {
                        targetNode.edgeIns.splice(j, 1); 
                        break;
                    }
                }
                // detach from sourceNode
                for (var j=0; j<sourceNode.edgeOuts.length; j++)
                {
                    if (sourceNode.edgeOuts[j] == edge)
                    {
                        sourceNode.edgeOuts.splice(j, 1); 
                        break;
                    }
                }
                // swap values of source and target nodes
                var tempRefDate     = edge.refDate1;
                var tempAggregateOp = edge.aggregateOp1;
                var tempID          = edge.sourceID;
                edge.sourceID       = edge.targetID;
                edge.refDate1       = edge.refDate2;
                edge.aggregateOp1   = edge.aggregateOp2;                    
                edge.targetID       = tempID;
                edge.refDate2       = tempRefDate;
                edge.aggregateOp2   = tempAggregateOp;
                // re-attach edge back to new source and target:
                this.nodes[edge.sourceID].addEdgeOut(edge);
                this.nodes[edge.targetID].addEdgeIn(edge);
            }
        }
        //return true;
    };

    // There should only be one startingNode . Save it. If multiple, flag fail.
    this.testForMultiStartsAndMultiEdges = function()
    {
        this.startingNode = null;
        for (var key in this.nodes)
        {
            if ( !this.nodes[key].hasEdgeIn() )
            {
                if ( this.startingNode == null )
                    this.startingNode = this.nodes[key];
                else 
                {
                    if (this.startingNode != this.nodes[key] )
                    {
                        this.startingNode = null;
                        return false;
                    }
                }
            }
            if ( this.nodes[key].hasMultipleEdgeIns() )
                return false;
            if ( this.nodes[key].hasMultipleEdgeOuts() )
                return false;
        }
        return true;
    };

    // traverse over nodes from this.startingNode to see if we have a cycle. (this.startingNode is set in this.testForMultiStartsAndMultiEdges())
    this.testForCycles = function()
    {
        //If there is no startingNode, then there IS a cycle, in which case we return false
        if (this.startingNode == undefined)
            return false;

        var node = this.startingNode;
        node.isMarked = true;
        while ( node.hasEdgeOut() )
        {
            node = this.nodes[node.edgeOuts[0].targetID];
            if ( node.isMarked ) // it's a node we've seen before, quit and return false
                return false;
            node.isMarked = true; 
        }
        return true;
    };

    this.initialize();
};


function TQueryGraphNode( id )
{
    this.initialize = function( id )
    {
        this.IDs[id] = id; // add id to ID list
    };

    this.addEdgeOut = function( edge )
    {
        this.edgeOuts.push(edge);
    };

    this.addEdgeIn = function( edge )
    {
        this.edgeIns.push(edge);
    };


    this.hasEdgeOut = function()
    { return (this.edgeOuts.length>0); }

    this.hasEdgeIn = function()
    { return (this.edgeIns.length>0); }

    this.hasMultipleEdgeOuts = function()
    { return (this.edgeOuts.length>1); };

    this.hasMultipleEdgeIns = function()
    { return (this.edgeIns.length>1); };

    this.getSortIDs = function()
    {
        var sortedIDArray = Object.keys(this.IDs)
        sortedIDArray.sort( function(a, b)
        {
            return a.localeCompare(b); // string comparison
        });
        return sortedIDArray;
    };

    this.ID             = id;
    /*
    this.refDate        = null; // can be startdate or enddate
    this.aggregateOp    = null; // can be first ever, any, last ever
    */

    this.IDs        = {};
    this.edgeOuts   = [];
    this.edgeIns    = [];

    this.equivalents = null;              // used in merging equal edges. Allows at most two entries, more than 2 means merge failed
    this.equivalentCommonNodeID = null;   

    this.isMarked   = false;
    this.initialize(this.ID);
};


function TQueryGraphEdge( srcNodeID, trgNodeID, type, refD1, refD2, agOp1, agOp2, spanArray )
{
    // eliminates greater than and greater types (eg: srcNode > trgNode -> trgNode < srcNode)
    this.normalizeDirection = function()
    {
        if ( this.type == "GREATEREQUAL" || this.type == "GREATER" )
            this.doFlipDirections();
    };

    this.doFlipDirections = function()
    {
        // leave LESSEQUAL/LESS alone
        if ( this.type == "LESSEQUAL" || this.type == "LESS" || this.type == "EQUAL")
            return;

        var temp = this.sourceID;
        this.sourceID = this.targetID;
        this.targetID = temp;
        if (this.type == "GREATEREQUAL")
            this.type = "LESSEQUAL";
        else if (this.type == "GREATER")
            this.type = "LESS";
    };

    // swap the source and target nodes for this edge
    /*
    this.swapSourceTargetForEqual = function( graph )
    {
        if ( this.type == "LESSEQUAL" || this.type == "LESS" || this.type == "EQUAL")
            return;

        // remove node references to this node.
        var sourceEdgeOuts = graph.nodes[this.sourceID].edgeOuts;
        for (var i  = 0; i < sourceEdgeOuts.length; i++ )
        {
            var edge = sourceEdgeOuts[i];
            if (this == edge)
            {
                sourceEdgeOuts.splice(i, 1);
                break;
            }
        }
        // remove node references to this node.
        var targetEdgeIns = graph.nodes[this.targetID].edgeIns;
        for (var i  = 0; i < targetEdgeIns.length; i++ )
        {
            var edge = targetEdgeIns[i];
            if (this == edge)
            {
                targetEdgeIns.splice(i, 1);
                break;
            }
        }

        graph.nodes[this.sourceID].edgeOuts
        var temp = {};
        temp.refD1 = this.refDate1;
        temp.agOp1 = this.aggregateOp1;
        temp.srcID = this.sourceID;

        this.sourceID = this.targetID;
        this.refDate1 = this.refDate2;
        this.aggregateOp1 = this.aggregateOp2;

        this.targetID = temp.srcID;
        this.refDate2 = temp.refD1;
        this.aggregateOp2 = temp.agOp1;
        // ignore spanArray because it does not matter for equal

        // reattach edge to edge out of source and edge in of target
        graph.nodes[soureID].edgeOuts.push(this);
        graph.nodes[targetID].edgeIns.push(this);
    };
    */


    // determine if the parameter edge is the same as this in the context of the given graph
    this.isSameEdge = function( edge, graph )
    {
        if ( (graph.nodes[this.sourceID] != graph.nodes[edge.sourceID]) ||
             (graph.nodes[this.targetID] != graph.nodes[edge.targetID]) ||
             (this.type != edge.type) ||
             (this.refDate1 != edge.refDate1) ||
             (this.refDate2 != edge.refDate2) ||            
             (this.aggregateOp1 != edge.aggregateOp1) ||
             (this.aggregateOp2 != edge.aggregateOp2)
           )
            return false;

        if (this.spans.length != edge.spans.length) 
            return false;
        else
        {
            if (this.spans.length > 0 && this.spans[0].makeDisplayText() != edge.spans[0].makeDisplayText() )
                return false;
            if (this.spans.length > 1 && this.spans[1].makeDisplayText() != edge.spans[1].makeDisplayText() )
                return false;
        }
        return true;
    };
    
    this.toString = function( )
    {
        var s = "";
        for ( var i = 0; i < this.spans.length; i++ )
            s = s + " " + this.spans[i].makeDisplayText();
        return refDate1 + " "  + aggregateOp1 + " " + this.sourceID + " " + this.type + " " + refDate2  + " " + aggregateOp2 + " " + this.targetID + s;
    };

    this.sourceID = srcNodeID;
    this.targetID = trgNodeID;
    this.type     = type;

    this.refDate1       = refD1 || null;
    this.refDate2       = refD2 || null;
    this.aggregateOp1   = agOp1 || null;
    this.aggregateOp2   = agOp2 || null;
    this.spans          = spanArray || null;
};


function TQueryEventGraphParser( queryDefXML )
{
    this.parse = function()
    {
        var graph = new TQueryEventGraph();
        var subConstraints = i2b2.h.XPath(this.xml, 'descendant::subquery_constraint');
        for (var i=0; i< subConstraints.length; i++)
        {
            // extract operator
            var ops = i2b2.h.XPath(subConstraints[i], 'descendant::operator');
            ops = i2b2.h.getXNodeVal( ops[0], "operator");
            // extract refDates
            var refDates = i2b2.h.XPath(subConstraints[i], 'descendant::join_column');
            var refDate1 = i2b2.h.getXNodeVal(refDates[0], "join_column");
            var refDate2 = i2b2.h.getXNodeVal(refDates[1], "join_column");
            // extract aggregator
            var aggregateOps = i2b2.h.XPath(subConstraints[i], 'descendant::aggregate_operator');
            var aggregateOp1 = i2b2.h.getXNodeVal(aggregateOps[0], "aggregate_operator");
            var aggregateOp2 = i2b2.h.getXNodeVal(aggregateOps[1], "aggregate_operator");
            // extract spans
            var spans = i2b2.h.XPath(subConstraints[i], 'descendant::span');
            var spanArray = [];
            for (var j=0; j< spans.length; j++)
            {
                var span ={};
                span.operator   = i2b2.h.getXNodeVal(spans[j], 'operator');
                span.value      = parseInt(i2b2.h.getXNodeVal(spans[j], 'span_value'));
                span.unit       = i2b2.h.getXNodeVal(spans[j], 'units');
                spanArray.push(span);
            }
            // extract sourceID
            var IDs = i2b2.h.XPath(subConstraints[i], 'descendant::query_id');
            var srcID = i2b2.h.getXNodeVal(IDs[0], 'query_id'); // first one is source
            var tgtID = i2b2.h.getXNodeVal(IDs[1], 'query_id'); // second one is target
            var edge = new TQueryGraphEdge(srcID, tgtID, ops, refDate1, refDate2, aggregateOp1, aggregateOp2, spanArray);

            graph.addEdge(edge);
        }
        // build graph and validate
        graph.normalizeAndSortEdges();
        graph.buildTopology();

        //graph.mergeEquals();
        /*
        var pass =             
        if (!pass) return false;
        */

        pass = graph.testForMultiStartsAndMultiEdges();
        if (!pass) return false;

        pass = graph.testForCycles();
        if (!pass) return false;

        return graph;
    };

    this.xml = queryDefXML;
};